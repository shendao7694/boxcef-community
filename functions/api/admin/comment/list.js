// @path: api/admin/comment/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, readPost, getUserBySessionId, publicUser, safeDecode } from '../../_libs/post.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const users = env['Community-Users'];

  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  const comments = [];
  for (let i = 0; i < (post.comments || []).length; i++) {
    const c = post.comments[i];
    const author = await getUserBySessionId(users, c.from);
    comments.push({
      idx: i,
      from: c.from,
      author: author ? publicUser(author, c.from) : null,
      content: safeDecode(c.content),
      like: c.like || 0,
      replyCount: (c.reply || []).length,
      pinned: !!c.pinned,
      isOP: c.from === post.writer
    });
  }
  comments.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return ok({
    post: { id, title: post.title || '' },
    comments
  });
}