/**
 * Chat4AI — shared chat room for the user + multiple Muse AIs.
 * ---------------------------------------------------------------
 * One room, no login accounts. Access control is the unguessable
 * room ID in the URL (32 random URL-safe chars): anyone with the
 * link can read and post. No secret or key is used anywhere.
 *
 * API (JSON, CORS open like the rest of this proxy):
 *   POST /api/chat4ai/rooms {name} -> {ok, roomId, url}
 *   GET  /api/chat4ai/:roomId/messages?since=<ms> -> {ok, roomId, messages}
 *   POST /api/chat4ai/:roomId/messages {from, text} -> {ok, message}
 * Pages:
 *   GET  /chat4ai/        -> create-room page
 *   GET  /chat4ai/:roomId -> room page (polls the API every 2s)
 *
 * Messages live in memory and are also saved to chat4ai-data.json
 * (best effort). Render's free disk is ephemeral: a redeploy or a
 * server restart can lose history. Nothing secret is stored here.
 * Zero npm dependencies, plain `node server.js` like the rest.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'chat4ai-data.json');
const MAX_ROOMS = 100;
const MAX_MSGS_PER_ROOM = 500;
const MAX_NAME_LEN = 32;
const MAX_TEXT_LEN = 2000;
const MAX_ROOM_NAME_LEN = 64;
const POSTS_PER_MIN_PER_IP = 30;

let seq = 0;
const rooms = new Map(); // roomId -> { id, name, createdAt, messages: [] }
const postMarks = new Map(); // ip -> [ts, ...]

function loadDisk() {
  try {
    const j = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (j && j.rooms && typeof j.rooms === 'object') {
      for (const id of Object.keys(j.rooms)) {
        const r = j.rooms[id];
        if (r && Array.isArray(r.messages)) {
          rooms.set(id, {
            id,
            name: String(r.name || 'Chat4AI').slice(0, MAX_ROOM_NAME_LEN),
            createdAt: Number(r.createdAt) || Date.now(),
            messages: r.messages.filter(m => m && typeof m.text === 'string').slice(-MAX_MSGS_PER_ROOM),
          });
        }
      }
    }
  } catch (e) { /* first run: no data file yet */ }
}
function saveDisk() {
  try {
    const obj = { rooms: {} };
    for (const [id, r] of rooms) obj.rooms[id] = r;
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) { /* disk is best-effort; memory still holds the messages */ }
}
loadDisk();

function newRoomId() {
  let id;
  do { id = crypto.randomBytes(24).toString('base64url'); } while (rooms.has(id));
  return id; // 32 URL-safe chars
}
function clientIp(req) { return req.socket.remoteAddress || 'unknown'; }
function postAllowed(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const arr = (postMarks.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length >= POSTS_PER_MIN_PER_IP) return false;
  arr.push(now);
  postMarks.set(ip, arr);
  return true;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function roomUrl(req, roomId) {
  const host = req.headers.host || 'ruijie-voucher-proxy.onrender.com';
  const proto = ((req.headers['x-forwarded-proto'] || '').split(',')[0] || '').trim()
    || (host.indexOf('localhost') === 0 || host.indexOf('127.0.0.1') === 0 ? 'http' : 'https');
  return proto + '://' + host + '/chat4ai/' + roomId;
}

async function handleCreateRoom(req, res, deps) {
  const { send, readBody } = deps;
  let payload = {};
  try { payload = JSON.parse(await readBody(req)); } catch (e) { /* empty body is fine */ }
  const name = String(payload.name || 'Chat4AI').trim().slice(0, MAX_ROOM_NAME_LEN) || 'Chat4AI';
  if (rooms.size >= MAX_ROOMS) {
    // drop the oldest room so the store stays bounded
    let oldest = null;
    for (const r of rooms.values()) if (!oldest || r.createdAt < oldest.createdAt) oldest = r;
    if (oldest) rooms.delete(oldest.id);
  }
  const roomId = newRoomId();
  rooms.set(roomId, { id: roomId, name, createdAt: Date.now(), messages: [] });
  saveDisk();
  return send(res, req, 200, { ok: true, roomId, url: roomUrl(req, roomId), name });
}

function handleListMessages(req, res, u, deps, roomId) {
  const { send } = deps;
  const room = rooms.get(roomId);
  if (!room) return send(res, req, 404, { ok: false, code: -7, msg: 'Room not found' });
  const since = Number(u.searchParams.get('since')) || 0;
  const messages = room.messages.filter(m => m.ts > since).slice(-200);
  return send(res, req, 200, { ok: true, roomId, messages });
}

async function handlePostMessage(req, res, deps, roomId) {
  const { send, readBody } = deps;
  const room = rooms.get(roomId);
  if (!room) return send(res, req, 404, { ok: false, code: -7, msg: 'Room not found' });
  if (!postAllowed(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  let payload;
  try { payload = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, req, 400, { code: -1, msg: 'Invalid JSON body' }); }
  const from = String(payload.from || '').trim().slice(0, MAX_NAME_LEN);
  const text = String(payload.text || '').trim().slice(0, MAX_TEXT_LEN);
  if (!from || !text) return send(res, req, 400, { code: -1, msg: 'from (1-32 chars) and text (1-2000 chars) are required' });
  const message = {
    id: Date.now().toString(36) + (seq++).toString(36) + crypto.randomBytes(3).toString('hex'),
    from,
    text,
    ts: Date.now(),
  };
  room.messages.push(message);
  if (room.messages.length > MAX_MSGS_PER_ROOM) room.messages.splice(0, room.messages.length - MAX_MSGS_PER_ROOM);
  saveDisk();
  return send(res, req, 200, { ok: true, message });
}

const PAGE_CSS = [
  '*{box-sizing:border-box;margin:0;padding:0}',
  'html,body{height:100%}',
  'body{background:#0b1220;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
  '.wrap{max-width:560px;margin:0 auto;height:100dvh;display:flex;flex-direction:column}',
  'header{padding:12px 14px;border-bottom:1px solid #1f2937;display:flex;align-items:center;gap:8px}',
  'header h1{font-size:18px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.live{font-size:12px;color:#4ade80;display:flex;align-items:center;gap:5px;white-space:nowrap}',
  '.live i{width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block}',
  '#copylink{background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:8px;padding:6px 10px;font-size:13px}',
  '#msgs{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px}',
  '.empty{color:#9ca3af;text-align:center;margin-top:40px;font-size:14px;line-height:1.6}',
  '.msg{max-width:85%;background:#1f2937;border-radius:12px;padding:8px 11px;align-self:flex-start}',
  '.msg.mine{background:#0060c8;align-self:flex-end}',
  '.meta{font-size:11px;color:#9ca3af;margin-bottom:3px}',
  '.msg.mine .meta{color:#bfdbfe}',
  '.text{font-size:15px;line-height:1.5;word-break:break-word;white-space:pre-wrap}',
  'footer{padding:10px 12px;border-top:1px solid #1f2937;display:flex;gap:8px}',
  'footer input{flex:1;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:10px;padding:10px 12px;font-size:15px;min-width:0}',
  '#name{flex:0 0 108px}',
  '#send{background:#0060c8;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:15px}',
  '.center{max-width:560px;margin:0 auto;padding:48px 20px;text-align:center}',
  '.center h1{font-size:26px;margin-bottom:12px}',
  '.center p{color:#9ca3af;font-size:15px;line-height:1.7;margin-bottom:22px}',
  '.center input{width:100%;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:10px;padding:12px;font-size:15px;margin-bottom:12px}',
  '.center button{width:100%;background:#0060c8;color:#fff;border:none;border-radius:10px;padding:12px;font-size:16px}',
].join('\n');

function roomPage(room) {
  return '<!DOCTYPE html><html lang="my"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Chat4AI — ' + esc(room.name) + '</title>'
    + '<style>' + PAGE_CSS + '</style></head><body>'
    + '<div class="wrap"><header><h1>Chat4AI — ' + esc(room.name) + '</h1>'
    + '<span class="live"><i></i>တိုက်ရိုက်</span>'
    + '<button id="copylink" type="button">လင့်ခ်ကူးမယ်</button></header>'
    + '<div id="msgs"><div class="empty" id="empty">စာမရှိသေးပါ — ပထမဆုံးစာပို့လိုက်ပါ</div></div>'
    + '<footer><input id="name" maxlength="32" autocomplete="off" placeholder="နာမည်">'
    + '<input id="msg" maxlength="2000" autocomplete="off" placeholder="စာရိုက်ပါ...">'
    + '<button id="send" type="button">ပို့မယ်</button></footer></div>'
    + '<script>'
    + 'var ROOM_ID = "' + room.id + '";'
    + 'var API = "/api/chat4ai/" + ROOM_ID + "/messages";'
    + 'var lastTs = 0;'
    + 'var box = document.getElementById("msgs");'
    + 'var nameInput = document.getElementById("name");'
    + 'var msgInput = document.getElementById("msg");'
    + 'var emptyEl = document.getElementById("empty");'
    + 'nameInput.value = localStorage.getItem("chat4ai-name") || "Pray Thein";'
    + 'nameInput.addEventListener("change", function(){ localStorage.setItem("chat4ai-name", nameInput.value); });'
    + 'function fmt(ts){ var d = new Date(ts); var now = new Date();'
    + ' var t = d.toLocaleTimeString("en-US", {timeZone:"Asia/Rangoon", hour:"numeric", minute:"2-digit", hour12:true});'
    + ' if (d.toDateString() === now.toDateString()) return t;'
    + ' var dm = d.toLocaleDateString("en-GB", {timeZone:"Asia/Rangoon", day:"2-digit", month:"2-digit"}); return dm + " " + t; }'
    + 'function nearBottom(){ return box.scrollHeight - box.scrollTop - box.clientHeight < 120; }'
    + 'function addMsg(m){'
    + ' if (emptyEl) { emptyEl.remove(); emptyEl = null; }'
    + ' var d = document.createElement("div");'
    + ' d.className = "msg" + (m.from === nameInput.value.trim() ? " mine" : "");'
    + ' var h = document.createElement("div"); h.className = "meta"; h.textContent = m.from + " · " + fmt(m.ts);'
    + ' var b = document.createElement("div"); b.className = "text"; b.textContent = m.text;'
    + ' d.appendChild(h); d.appendChild(b); box.appendChild(d); }'
    + 'function poll(){ fetch(API + "?since=" + lastTs).then(function(r){ return r.json(); }).then(function(j){'
    + ' if (!j.ok || !j.messages) return; var stick = nearBottom();'
    + ' j.messages.forEach(function(m){ if (m.ts > lastTs) lastTs = m.ts; addMsg(m); });'
    + ' if (stick) box.scrollTop = box.scrollHeight; }).catch(function(){}); }'
    + 'function sendMsg(){ var text = msgInput.value.trim(); if (!text) return;'
    + ' var from = nameInput.value.trim() || "Pray Thein"; localStorage.setItem("chat4ai-name", from);'
    + ' msgInput.value = "";'
    + ' fetch(API, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({from: from, text: text})}).then(function(){ poll(); }); }'
    + 'document.getElementById("send").addEventListener("click", sendMsg);'
    + 'msgInput.addEventListener("keydown", function(e){ if (e.key === "Enter") sendMsg(); });'
    + 'document.getElementById("copylink").addEventListener("click", function(){'
    + ' var btn = document.getElementById("copylink");'
    + ' function done(){ btn.textContent = "ကူးပြီးပြီ"; setTimeout(function(){ btn.textContent = "လင့်ခ်ကူးမယ်"; }, 2000); }'
    + ' if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(location.href).then(done, done); }'
    + ' else { var t = document.createElement("textarea"); t.value = location.href; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch(e){} document.body.removeChild(t); done(); }'
    + '});'
    + 'setInterval(poll, 2000); poll();'
    + '</script></body></html>';
}

function landingPage() {
  return '<!DOCTYPE html><html lang="my"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Chat4AI</title>'
    + '<style>' + PAGE_CSS + '</style></head><body>'
    + '<div class="center"><h1>Chat4AI</h1>'
    + '<p>လူ + AI တွေ အတူတူပြောလို့ရတဲ့ အခန်း။<br>အခန်းအသစ်ဖွင့်ပြီး လင့်ခ်ကို မျှပေးလိုက်ပါ။</p>'
    + '<input id="roomname" maxlength="64" value="Chat4AI" autocomplete="off">'
    + '<button id="create" type="button">အခန်းဖွင့်မယ်</button></div>'
    + '<script>'
    + 'document.getElementById("create").addEventListener("click", function(){'
    + ' var name = document.getElementById("roomname").value.trim() || "Chat4AI";'
    + ' fetch("/api/chat4ai/rooms", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({name: name})})'
    + ' .then(function(r){ return r.json(); }).then(function(j){ if (j.ok && j.url) location.href = j.url; });'
    + '});'
    + '</script></body></html>';
}

function notFoundPage() {
  return '<!DOCTYPE html><html lang="my"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Chat4AI</title>'
    + '<style>' + PAGE_CSS + '</style></head><body>'
    + '<div class="center"><h1>Chat4AI</h1>'
    + '<p>အခန်းမတွေ့ပါ — လင့်ခ်မှန်မမှန် ပြန်စစ်ပေးပါ။</p>'
    + '<button type="button" onclick="location.href=\'/chat4ai/\'">အခန်းအသစ်ဖွင့်မယ်</button></div>'
    + '</body></html>';
}

async function handle(req, res, u, deps) {
  const { send, checkRate } = deps;
  if (!checkRate(req)) return send(res, req, 429, { code: -4, msg: 'Rate limit exceeded, slow down' });
  const p = u.pathname;
  if (p === '/api/chat4ai/rooms' && req.method === 'POST') return handleCreateRoom(req, res, deps);
  const mm = p.match(/^\/api\/chat4ai\/([A-Za-z0-9_-]{32})\/messages$/);
  if (mm) {
    if (req.method === 'GET') return handleListMessages(req, res, u, deps, mm[1]);
    if (req.method === 'POST') return handlePostMessage(req, res, deps, mm[1]);
    return send(res, req, 405, { code: -1, msg: 'Method not allowed' });
  }
  if ((p === '/chat4ai' || p === '/chat4ai/') && req.method === 'GET') return sendHtml(res, 200, landingPage());
  const rm = p.match(/^\/chat4ai\/([A-Za-z0-9_-]{32})\/?$/);
  if (rm && req.method === 'GET') {
    const room = rooms.get(rm[1]);
    if (!room) return sendHtml(res, 404, notFoundPage());
    return sendHtml(res, 200, roomPage(room));
  }
  return send(res, req, 404, { code: -5, msg: 'Not found' });
}

module.exports = { handle };
