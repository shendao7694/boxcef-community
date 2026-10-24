// @path: api/admin/settings/index.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings, setSettings } from '../../_libs/settings.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}

  const patch = {};
  if (body.tokenValidTime !== undefined) {
    patch.tokenValidTime = Number(body.tokenValidTime) || 720;
  }
  if (body.registerNeedEmailVerity !== undefined) {
    patch.registerNeedEmailVerity = !!body.registerNeedEmailVerity;
  }
  if (body.maxUploadSize !== undefined) {
    const n = Number(body.maxUploadSize);
    if (!Number.isFinite(n) || n <= 0) return fail('maxUploadSize 无效');
    patch.maxUploadSize = Math.floor(n);
  }
  if (body.buildUserIdxTime !== undefined) {
    const n = Number(body.buildUserIdxTime);
    if (!Number.isFinite(n) || n <= 0) return fail('buildUserIdxTime 无效');
    patch.buildUserIdxTime = Math.floor(n);
  }
  if (body.maxImageInDisc !== undefined) {
    const n = Number(body.maxImageInDisc);
    if (!Number.isFinite(n) || n <= 0) return fail('maxImageInDisc 无效');
    patch.maxImageInDisc = Math.floor(n);
  }
  if (Array.isArray(body.pinnedPosts)) {
    patch.pinnedPosts = body.pinnedPosts.filter(x => typeof x === 'string');
  }

  const settings = await setSettings(env, patch);
  return ok({ settings });
}