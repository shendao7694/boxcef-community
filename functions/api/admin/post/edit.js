// @path: api/admin/post/edit.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, readPost, writePost, b64encode, safeDecode } from '../../_libs/post.js';
import { getTagDict, sanitizePostTypes, getPostIdx, savePostIdx, addToIdx, removeFromIdx } from '../../_libs/postIdx.js';


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
      content: safeDecode(post.data),
      type: Array.isArray(post.type) ? post.type : []
    }
  });
}


export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, title, content, type } = body || {};
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const service = env['Community-Service'];
  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  const oldTypes = Array.isArray(post.type) ? post.type : [];

  if (content !== undefined) {
    if (typeof content !== 'string' || !content.trim()) return fail('内容不能为空');
    if (content.length > 200000) return fail('内容过长');
    post.data = b64encode(content);
  }
  if (title !== undefined) {
    post.title = String(title).slice(0, 100);
  }

  if (type !== undefined) {
    const dict = await getTagDict(service);
    const newTypes = sanitizePostTypes(type, dict);
    post.type = newTypes;

    const idx = await getPostIdx(service);
    removeFromIdx(idx, id, oldTypes.filter(t => !newTypes.includes(t)));
    addToIdx(idx, id, newTypes.filter(t => !oldTypes.includes(t)));
    await savePostIdx(service, idx);
  }

  await writePost(works, id, post);
  return ok({ id });
}
