// @path: api/admin/post/edit.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, readPost, writePost, b64encode, safeDecode } from '../../_libs/post.js';

// GET /api/admin/post-edit?id=<postId>  -> fetch post content for editing
export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  return ok({
    post: {
      id,
      title: post.title || '',
      content: safeDecode(post.data)
    }
  });
}

// POST /api/admin/post-edit { id, title, content }  -> save modifications
export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, title, content } = body || {};
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  if (content !== undefined) {
    if (typeof content !== 'string' || !content.trim()) return fail('内容不能为空');
    if (content.length > 200000) return fail('内容过长');
    post.data = b64encode(content);
  }
  if (title !== undefined) {
    post.title = String(title).slice(0, 100);
  }

  await writePost(works, id, post);
  return ok({ id });
}
