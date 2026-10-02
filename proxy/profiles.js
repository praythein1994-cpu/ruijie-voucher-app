/**
 * Named login profiles — v1.5.79
 * -------------------------------
 * Lets the app sign in with a single typed name. A profile holds one user's
 * Open-API credentials (cloud, appid, secret, proxy) plus their Ruijie
 * portal account (email, password).
 *
 * Storage tiers (in lookup order):
 *   1. phone  — the app's own localStorage (handled client-side)
 *   2. render — this proxy's disk file (profiles.json next to server.js)
 *   3. github — a JSON file in a repo (read-through cache + write-through)
 *
 * SECURITY NOTES (operator read this):
 * - Profiles contain real secrets (app secret, portal password). The disk
 *   file and the GitHub repo MUST be treated as secret material: private
 *   repo, limited Render access. Nothing here encrypts them at rest.
 * - GET /api/profiles/:name is intentionally open: typing the name returns
 *   the profile (that is the requested UX). Usernames are NOT a secret.
 * - PUT is gated by PROFILES_KEY when set: the app sends the key the user
 *   typed once in the create-account form. Without the env var, writes are
 *   open — set it on Render.
 * - Secrets are NEVER written to logs. Validation errors name the field,
 *   never the value.
 *
 * File shape on disk / GitHub:
 *   { "profiles": { "<name>": { name, display, cloud, appid, secret,
 *                               proxy, email, password, pinHash, updatedAt } } }
 * pinHash (v1.5.144): SHA-256 hex of the owner's 6-digit login PIN. Only the
 *   "praythein" profile uses it; the app hashes the typed PIN and compares,
 *   so the PIN itself is never stored on disk/GitHub/the phone.
 */

'use strict';

const PROFILE_FIELDS = ['name', 'display', 'cloud', 'appid', 'secret', 'proxy', 'email', 'password', 'pinHash', 'updatedAt'];

/** Normalize a typed name to its lookup key. Case- and space-insensitive:
 *  "PrayThein", "praythein", "Pray Thein" and "pray Thein" all -> "praythein".
 *  Returns '' when invalid. */
function normName(raw) {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, '');
  if (s.length < 2 || s.length > 32) return '';
  if (!/^[a-z0-9._-]+$/.test(s)) return '';
  if (/^[.\-]|[.\-]$/.test(s)) return '';
  return s;
}

/**
 * Validate a profile object. Returns null when OK, else a short error code
 * (field name, never the value).
 */
function validateProfile(p) {
  if (!p || typeof p !== 'object') return 'profile';
  const name = normName(p.name);
  if (!name) return 'name';
  if (!p.appid || String(p.appid).trim().length < 2) return 'appid';
  if (!p.secret || String(p.secret).trim().length < 2) return 'secret';
  if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email).trim())) return 'email';
  if (!p.password || String(p.password).length < 1) return 'password';
  // v1.5.144: owner login PIN — stored as SHA-256 hex, never plaintext.
  if (p.pinHash !== undefined && p.pinHash !== null && String(p.pinHash) !== '' &&
      !/^[0-9a-f]{64}$/i.test(String(p.pinHash))) return 'pinHash';
  const cloud = String(p.cloud || '').trim().replace(/\/+$/, '');
  if (cloud && !/^https?:\/\//i.test(cloud)) return 'cloud';
  const proxy = String(p.proxy || '').trim().replace(/\/+$/, '');
  if (proxy && !/^https?:\/\//i.test(proxy)) return 'proxy';
  return null;
}

/** Build the canonical stored profile from user input. Assumes validateProfile(p) === null. */
function buildProfile(p) {
  const name = normName(p.name);
  const clean = v => String(v === undefined || v === null ? '' : v).trim();
  return {
    name,
    display: clean(p.display) || clean(p.name),
    cloud: clean(p.cloud).replace(/\/+$/, '') || 'https://cloud-as.ruijienetworks.com',
    appid: clean(p.appid),
    secret: String(p.secret || ''),
    proxy: clean(p.proxy).replace(/\/+$/, ''),
    email: clean(p.email),
    password: String(p.password || ''),
    // v1.5.144: keep only a well-formed SHA-256 hex PIN hash, else blank.
    pinHash: /^[0-9a-f]{64}$/i.test(clean(p.pinHash)) ? clean(p.pinHash).toLowerCase() : '',
    updatedAt: Date.now(),
  };
}

/** Strip an object down to the known profile fields (defense on the way out). */
function sanitizeProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const out = {};
  for (const k of PROFILE_FIELDS) {
    if (k === 'updatedAt') out[k] = Number(p[k]) || 0;
    else out[k] = p[k] === undefined || p[k] === null ? '' : String(p[k]);
  }
  return out;
}

/** Normalize a whole store file: { profiles: { name: profile } }. */
function normalizeStore(data) {
  const profiles = {};
  if (data && typeof data === 'object' && data.profiles && typeof data.profiles === 'object') {
    for (const k of Object.keys(data.profiles)) {
      const key = normName(k);
      const sp = sanitizeProfile(data.profiles[k]);
      if (key && sp && sp.name) profiles[key] = sp;
    }
  }
  const settings = {};
  if (data && typeof data === 'object' && data.settings && typeof data.settings === 'object') {
    for (const k of Object.keys(data.settings)) {
      const key = normName(k);
      const e = data.settings[k];
      if (key && e && typeof e === 'object' && e.settings && typeof e.settings === 'object') {
        settings[key] = { settings: e.settings, updatedAt: Number(e.updatedAt) || 0 };
      }
    }
  }
  return { profiles, settings };
}

/** Merge: disk wins over github (writes always hit disk first, so it is fresher). */
function mergeStores(diskStore, githubStore) {
  const d = normalizeStore(diskStore), g = normalizeStore(githubStore);
  return { profiles: { ...g.profiles, ...d.profiles }, settings: { ...g.settings, ...d.settings } };
}

module.exports = {
  PROFILE_FIELDS,
  normName,
  validateProfile,
  buildProfile,
  sanitizeProfile,
  normalizeStore,
  mergeStores,
};
