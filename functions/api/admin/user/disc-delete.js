// @path: api/admin/user/disc-delete.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { key, hashes } = body || {};
  if (!key || !Array.isArray(hashes) || !hashes.length) return fail('参数错误');

  const users = env['Community-Users'];
  const assets = env['Community-Assets'];

  const raw = await users.get(key);
  if (!raw) return fail('用户不存在', 404);

  let user;
  try { user = JSON.parse(raw); } catch { return fail('数据损坏'); }

  user.imageDisc = (user.imageDisc || []).filter(h => !hashes.includes(h));

  for (const hash of hashes) {
    await assets.delete(hash);
  }

  await users.put(key, JSON.stringify(user));
  return ok({ imageDisc: user.imageDisc });
}