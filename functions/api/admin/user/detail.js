// @path: api/admin/user/detail.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return fail('缺少 key');

  const users = env['Community-Users'];
  const raw = await users.get(key);
  if (!raw) return fail('用户不存在', 404);

  let user;
  try { user = JSON.parse(raw); } catch { return fail('数据损坏'); }

  const { password, ...safe } = user;
  return ok({ user: safe });
}