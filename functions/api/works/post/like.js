// @path: api/works/post/like.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getWorks, readPost, writePost } from '../../_libs/works.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, action } = body || {};
  if (!id) return fail('缺少 id');
  if (!['like', 'unlike'].includes(action)) return fail('无效的操作');

  const works = getWorks(env);
  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  const likedBy = post.likedBy || [];
  const has = likedBy.includes(self.key);

  if (action === 'like' && !has) likedBy.push(self.key);
  else if (action === 'unlike' && has) {
    post.likedBy = likedBy.filter(x => x !== self.key);
  } else {
    post.likedBy = likedBy;
  }

  post.like = (post.likedBy || []).length;
  await writePost(works, id, post);

  return ok({ like: post.like, liked: (post.likedBy || []).includes(self.key) });
}