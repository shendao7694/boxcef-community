// @path: api/_libs/userIdx.js
import { getSettings } from './settings.js';

const IDX_KEY = 'userIdx';
const DEFAULT_BUILD_HOURS = 168;

export async function getUserIdx(service) {
  const raw = await service.get(IDX_KEY, { type: 'json' });
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.name || !raw.nickname) return null;
  return raw;
}

export async function rebuildUserIdx(env) {
  const service = env['Community-Service'];
  const users = env['Community-Users'];

  const nameMap = {};
  const nicknameMap = {};

  let cursor;
  do {
    const list = await users.list({ cursor });
    for (const k of list.keys) {
      if (!/^[0-9a-f]{64}$/.test(k.name)) continue;
      const raw = await users.get(k.name);
      if (!raw) continue;
      let s;
      try { s = JSON.parse(raw); } catch { continue; }
      if (s.name) nameMap[s.name] = k.name;
      if (s.nickname) nicknameMap[s.nickname] = k.name;
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  const idx = {
    name: nameMap,
    nickname: nicknameMap,
    lastBuildTime: Date.now()
  };
  await service.put(IDX_KEY, JSON.stringify(idx));
  return idx;
}

export async function ensureUserIdx(env, context) {
  const service = env['Community-Service'];
  const idx = await getUserIdx(service);

  if (!idx) {
    if (context && context.waitUntil) {
      context.waitUntil(rebuildUserIdx(env));
    }
    return { status: 'building' };
  }

  const settings = await getSettings(env);
  const maxAgeH = Number(settings.buildUserIdxTime) || DEFAULT_BUILD_HOURS;
  const maxAgeMs = maxAgeH * 3600 * 1000;

  if (Date.now() - (idx.lastBuildTime || 0) > maxAgeMs) {
    if (context && context.waitUntil) {
      context.waitUntil(rebuildUserIdx(env));
    }
    return { status: 'building' };
  }

  return { status: 'ok', idx };
}

export function searchUserIdx(idx, q) {
  const out = new Set();
  const kw = String(q || '').trim().toLowerCase();
  if (!kw) return out;

  for (const [name, key] of Object.entries(idx.name || {})) {
    if (name.toLowerCase().includes(kw)) out.add(key);
  }
  for (const [nick, key] of Object.entries(idx.nickname || {})) {
    if (nick.toLowerCase().includes(kw)) out.add(key);
  }
  return out;
}