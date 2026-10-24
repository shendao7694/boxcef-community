// @path: api/admin/title/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getTitles } from '../../_libs/title.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);
  const service = env['Community-Service'];
  const titles = await getTitles(service);
  return ok({ titles });
}