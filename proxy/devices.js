/* Device install registry (v1.5.143).
 * The owner (Pray Thein) can see which devices installed the app, cap the
 * device count, require approval for new devices, and block unknown ones.
 * Store: devices.json on disk — { devices: {id: {...}}, config: {...} }.
 * Admin endpoints are gated by the normalized profile name 'praythein'
 * (same casual name-only trust model as the named login itself).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = process.env.DEVICES_FILE || path.join(__dirname, 'devices.json');
const ADMIN_PROFILE = 'praythein';

function normName(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '');
}

function normalize(store) {
  const out = { devices: {}, config: { maxDevices: 10, requireApproval: false } };
  if (store && typeof store === 'object') {
    if (store.devices && typeof store.devices === 'object') out.devices = store.devices;
    if (store.config && typeof store.config === 'object') {
      const m = Number(store.config.maxDevices);
      if (Number.isFinite(m)) out.config.maxDevices = Math.min(100, Math.max(1, Math.round(m)));
      out.config.requireApproval = !!store.config.requireApproval;
    }
  }
  return out;
}

function readStore() {
  try {
    return normalize(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch (e) {
    return normalize(null);
  }
}

function writeStore(store) {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
}

/** Devices that count against the cap (blocked ones are out). */
function activeCount(devices) {
  return Object.values(devices).filter(d => d && d.status !== 'blocked').length;
}

/**
 * Register (or refresh) a device. Returns 'allowed' | 'pending' | 'blocked'.
 * New devices: pending when the cap is reached or approval is required.
 */
function registerDevice(store, info) {
  const id = String((info && info.deviceId) || '').slice(0, 128);
  if (!id) return null;
  const now = Date.now();
  const d = store.devices[id];
  if (d) {
    d.lastSeen = now;
    if (info.model) d.model = String(info.model).slice(0, 64);
    if (info.manufacturer) d.manufacturer = String(info.manufacturer).slice(0, 64);
    if (info.android) d.android = String(info.android).slice(0, 16);
    if (info.appVersion) d.appVersion = String(info.appVersion).slice(0, 32);
    if (info.profile) d.profile = normName(info.profile);
    return d.status || 'allowed';
  }
  let status = 'allowed';
  if (activeCount(store.devices) >= store.config.maxDevices) status = 'pending';
  else if (store.config.requireApproval) status = 'pending';
  store.devices[id] = {
    id,
    status,
    model: String(info.model || '').slice(0, 64),
    manufacturer: String(info.manufacturer || '').slice(0, 64),
    android: String(info.android || '').slice(0, 16),
    appVersion: String(info.appVersion || '').slice(0, 32),
    profile: normName(info.profile),
    src: String(info.src || '').slice(0, 16),
    firstSeen: now,
    lastSeen: now,
  };
  return status;
}

module.exports = {
  FILE,
  ADMIN_PROFILE,
  normName,
  normalize,
  readStore,
  writeStore,
  activeCount,
  registerDevice,
};
