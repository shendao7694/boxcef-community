// @path: api/admin/comment/pin.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, readPost, writePost } from '../../_libs/post.js';

// POST /api/admin/comment-pin { id, index, action: 'pin' | 'unpin' }
export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, index, action } = body || {};
  if (!id) return fail('缺少 id');
  if (typeof index !== 'number') return fail('参数错误');
  if (!['pin', 'unpin'].includes(action)) return fail('无效的操作');

  const works = getWorks(env);
  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);
  post.comments = post.comments || [];

  const c = post.comments[index];
  if (!c) return fail('评论不存在');

  c.pinned = action === 'pin';
  await writePost(works, id, post);

  return ok({ index, pinned: c.pinned });
}
