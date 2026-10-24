// @path: api/admin/comment/delete.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, readPost, writePost } from '../../_libs/post.js';

// POST /api/admin/comment-delete { id, index, replyIndex? }
// replyIndex omitted -> delete the whole comment; otherwise delete that reply
export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, index, replyIndex } = body || {};
  if (!id) return fail('缺少 id');
  if (typeof index !== 'number') return fail('参数错误');

  const works = getWorks(env);
  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);
  post.comments = post.comments || [];

  const c = post.comments[index];
  if (!c) return fail('评论不存在');

  if (typeof replyIndex === 'number') {
    if (!c.reply || !c.reply[replyIndex]) return fail('回复不存在');
    c.reply.splice(replyIndex, 1);
  } else {
    post.comments.splice(index, 1);
  }

  await writePost(works, id, post);
  return ok({ deleted: true });
}
