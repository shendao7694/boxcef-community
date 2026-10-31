// @path: api/admin/tag/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getCustomTags, POST_TYPES } from '../../_libs/postIdx.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);
  const service = env['Community-Service'];
  const custom = await getCustomTags(service);
  return ok({ fixed: POST_TYPES, custom });
}
