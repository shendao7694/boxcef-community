// @path: api/admin/auth.js
import { ok, fail } from '../_libs/response.js';
import { verifyAdmin } from '../_libs/admin.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);
  return ok();
}
