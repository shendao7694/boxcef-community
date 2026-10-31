// @path: api/admin/post/delete.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings, setSettings } from '../../_libs/settings.js';
import { postKey, readPost } from '../../_libs/post.js';
import { getPostIdx, savePostIdx, removeFromIdx } from '../../_libs/postIdx.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id } = body || {};
  if (!id) return fail('缺少 id');

  const works = env['Community-Works'];
  const users = env['Community-Users'];
  const service = env['Community-Service'];

  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  await works.delete(postKey(id));

  const idx = await getPostIdx(service);
  removeFromIdx(idx, id);
  await savePostIdx(service, idx);

  const writerRaw = await users.get(post.writer);
  if (writerRaw) {
    try {
      const w = JSON.parse(writerRaw);
      w.posts = (w.posts || []).filter(x => x !== id);
      await users.put(post.writer, JSON.stringify(w));
    } catch {}
  }

  const settings = await getSettings(env);
  if (Array.isArray(settings.pinnedPosts) && settings.pinnedPosts.includes(id)) {
    await setSettings(env, {
      pinnedPosts: settings.pinnedPosts.filter(x => x !== id)
    });
  }

  return ok();
}