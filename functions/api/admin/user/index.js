// @path: api/admin/user/index.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { key } = body || {};
  if (!key) return fail('缺少 key');

  const users = env['Community-Users'];
  const assets = env['Community-Assets'];

  const raw = await users.get(key);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      if (s.avatar && s.avatar !== 'COMMON:normal_avatar') {
        await assets.delete(s.avatar);
      }
    } catch {}
    await users.delete(key);
  }

  return ok();
}