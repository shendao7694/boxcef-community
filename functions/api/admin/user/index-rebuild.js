// @path: api/admin/user/index-rebuild.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { rebuildUserIdx } from '../../_libs/userIdx.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const idx = await rebuildUserIdx(env);
  return ok({
    nameCount: Object.keys(idx.name).length,
    nicknameCount: Object.keys(idx.nickname).length,
    lastBuildTime: idx.lastBuildTime
  });
}