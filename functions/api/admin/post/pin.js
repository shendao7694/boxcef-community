// @path: api/admin/post/pin.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings, setSettings } from '../../_libs/settings.js';
import { readPost } from '../../_libs/post.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, action } = body || {};
  if (!id) return fail('缺少 id');
  if (!['pin', 'unpin'].includes(action)) return fail('无效的操作');

  const works = env['Community-Works'];

  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  const settings = await getSettings(env);
  let ids = Array.isArray(settings.pinnedPosts) ? settings.pinnedPosts.slice() : [];

  if (action === 'pin') {
    if (!ids.includes(id)) ids.unshift(id);
  } else {
    ids = ids.filter(x => x !== id);
  }

  const next = await setSettings(env, { pinnedPosts: ids });
  return ok({ pinnedPosts: next.pinnedPosts });
}