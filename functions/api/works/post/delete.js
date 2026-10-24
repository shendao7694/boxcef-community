// @path: api/works/post/delete.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getSettings, setSettings } from '../../_libs/settings.js';
import { getWorks, postKey, readPost } from '../../_libs/works.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id } = body || {};
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const users = env['Community-Users'];

  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);
  if (post.writer !== self.key) return fail('无权限', 403);

  await works.delete(postKey(id));

  const me = self.session;
  me.posts = (me.posts || []).filter(x => x !== id);
  await users.put(self.key, JSON.stringify(me));

  const settings = await getSettings(env);
  if (Array.isArray(settings.pinnedPosts) && settings.pinnedPosts.includes(id)) {
    await setSettings(env, {
      pinnedPosts: settings.pinnedPosts.filter(x => x !== id)
    });
  }

  return ok();
}