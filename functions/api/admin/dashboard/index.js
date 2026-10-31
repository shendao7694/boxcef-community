// @path: api/admin/dashboard/index.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

async function collectKeys(kv, prefix, filter) {
  const names = [];
  let cursor;
  do {
    const list = await kv.list({ cursor, prefix });
    for (const key of list.keys) {
      if (!filter || filter(key.name)) names.push(key.name);
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);
  return names;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
}

async function loadUsers(usersKv) {
  const names = await collectKeys(usersKv, undefined, n => /^[0-9a-f]{64}$/.test(n));
  const raws = await mapLimit(names, 10, n => usersKv.get(n));
  return names.map((name, i) => {
    const raw = raws[i];
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      return {
        key: name,
        name: s.name,
        nickname: s.nickname,
        email: s.email,
        group: s.group,
        avatar: s.avatar,
        description: s.description,
        limit: s.limit || null,
        lastLoginTime: s.lastLoginTime,
        lastLoginIp: s.lastLoginIp,
        hasToken: false
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

async function loadVerifications(service) {
  const names = await collectKeys(service, 'verification:');
  const raws = await mapLimit(names, 10, n => service.get(n));
  return names.map((name, i) => {
    const raw = raws[i];
    if (!raw) return null;
    try {
      const v = JSON.parse(raw);
      return { key: name, purpose: v.purpose, code: v.code, expire: v.expire };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

async function loadAssets(assets) {
  const names = await collectKeys(assets);
  const raws = await mapLimit(names, 10, n => assets.get(n));
  return names.map((name, i) => {
    const raw = raws[i];
    let date = 'none';
    let type = 'unknown';
    let size = 0;
    let previewable = false;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        date = parsed.date || 'none';
        type = parsed.type || 'unknown';
        size = parsed.data ? Math.floor(parsed.data.length * 0.75) : 0;
        previewable = type.startsWith('image/') || type.startsWith('text/');
      } catch {}
    }
    return { key: name, date, type, size, previewable };
  });
}

function loadSettings(service) {
  return service.get('globalSettings', { type: 'json' }).then(s => s || {});
}

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const service = env['Community-Service'];
  const assets = env['Community-Assets'];
  const usersKv = env['Community-Users'];

  const section = new URL(request.url).searchParams.get('section');

  if (section === 'users') return ok({ users: await loadUsers(usersKv) });
  if (section === 'verifications') return ok({ verifications: await loadVerifications(service) });
  if (section === 'assets') return ok({ assets: await loadAssets(assets) });
  if (section === 'settings') return ok({ settings: await loadSettings(service) });
  if (section) return fail('无效的 section');

  const [users, verifications, assetsList, settings] = await Promise.all([
    loadUsers(usersKv),
    loadVerifications(service),
    loadAssets(assets),
    loadSettings(service)
  ]);

  return ok({ users, tokens: [], assets: assetsList, settings, verifications });
}
