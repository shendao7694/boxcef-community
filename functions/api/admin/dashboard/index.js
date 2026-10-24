// @path: api/admin/dashboard/index.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const service = env['Community-Service'];
  const assets = env['Community-Assets'];
  const usersKv = env['Community-Users'];

  const users = [];
  const verifications = [];

  let cursor;
  do {
    const list = await usersKv.list({ cursor });
    for (const key of list.keys) {
      if (!/^[0-9a-f]{64}$/.test(key.name)) continue;
      const raw = await usersKv.get(key.name);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw);
        users.push({
          key: key.name,
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
        });
      } catch {}
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  let scursor;
  do {
    const list = await service.list({ cursor: scursor });
    for (const key of list.keys) {
      if (key.name.startsWith('verification:')) {
        const raw = await service.get(key.name);
        if (raw) {
          try {
            const v = JSON.parse(raw);
            verifications.push({
              key: key.name,
              purpose: v.purpose,
              code: v.code,
              expire: v.expire
            });
          } catch {}
        }
      }
    }
    scursor = list.cursor;
    if (list.list_complete) break;
  } while (scursor);

  const assetsList = [];
  let acursor;
  do {
    const list = await assets.list({ cursor: acursor });
    for (const key of list.keys) {
      const raw = await assets.get(key.name);
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
      assetsList.push({ key: key.name, date, type, size, previewable });
    }
    acursor = list.cursor;
    if (list.list_complete) break;
  } while (acursor);

  const settings = await service.get('globalSettings', { type: 'json' }) || {};

  return ok({ users, tokens: [], assets: assetsList, settings, verifications });
}