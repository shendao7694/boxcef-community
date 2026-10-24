// @path: api/admin/asset/delete.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { key } = body || {};
  if (!key) return fail('缺少 key');
  if (key === 'COMMON:normal_avatar') return fail('默认头像不可删除', 400);

  const assets = env['Community-Assets'];
  const users = env['Community-Users'];

  let cursor;
  do {
    const list = await users.list({ cursor });
    for (const k of list.keys) {
      if (!/^[0-9a-f]{64}$/.test(k.name)) continue;
      const raw = await users.get(k.name);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw);
        if (s.avatar === key) {
          s.avatar = 'COMMON:normal_avatar';
          await users.put(k.name, JSON.stringify(s));
        }
      } catch {}
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  await assets.delete(key);
  return ok();
}