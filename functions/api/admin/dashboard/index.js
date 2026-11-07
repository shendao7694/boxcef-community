// @path: api/admin/dashboard/index.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings } from '../../_libs/settings.js';

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
        isban: !!s.isban,
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

function loadSettings(env) {
  return getSettings(env);
}

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const service = env['Community-Service'];
  const assets = env['Community-Assets'];
  const usersKv = env['Community-Users'];

  const url = new URL(request.url);
  const section = url.searchParams.get('section');

  if (section === 'users') {
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const rawSize = Number(url.searchParams.get('pageSize')) || 10;
    const pageSize = [10, 30, 50, 100].includes(rawSize) ? rawSize : 10;

    let users = await loadUsers(usersKv);
    if (q) {
      users = users.filter(u => `${u.name || ''} ${u.nickname || ''} ${u.email || ''}`.toLowerCase().includes(q));
    }
    users.sort((a, b) => (b.lastLoginTime || 0) - (a.lastLoginTime || 0));

    const total = users.length;
    const start = (page - 1) * pageSize;
    return ok({ users: users.slice(start, start + pageSize), total, page, pageSize });
  }
  if (section === 'verifications') return ok({ verifications: await loadVerifications(service) });
  if (section === 'assets') return ok({ assets: await loadAssets(assets) });
  if (section === 'settings') return ok({ settings: await loadSettings(env) });
  if (section) return fail('无效的 section');

  const [users, verifications, assetsList, settings] = await Promise.all([
    loadUsers(usersKv),
    loadVerifications(service),
    loadAssets(assets),
    loadSettings(env)
  ]);

  return ok({ users, tokens: [], assets: assetsList, settings, verifications });
}
