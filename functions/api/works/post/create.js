// @path: api/works/post/create.js
import { sha256 } from '../../_libs/crypto.js';
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { b64encode, getWorks, postKey } from '../../_libs/works.js';
import { getSettings } from '../../_libs/settings.js';
import { readUserLimit } from '../../_libs/limit.js';
import { getTagDict, sanitizePostTypes, getPostIdx, savePostIdx, addToIdx } from '../../_libs/postIdx.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const settings = await getSettings(env);
  const limit = readUserLimit(self.session, settings);
  const now = Date.now(); 

  
  if (now - (self.session.lastPostTime || 0) < limit.publishPostCooling * 1000) {
    return fail(`发布过于频繁，请等待 ${limit.publishPostCooling} 秒`, 429);
  }

  
  self.session.posts = self.session.posts || [];
  if (self.session.posts.length >= limit.publishPostMax) {
    return fail(`你最多只能发布 ${limit.publishPostMax} 个帖子`, 400);
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const { title, content, type } = body || {};
  if (!content || typeof content !== 'string') return fail('内容不能为空');
  if (content.length > 200000) return fail('内容过长');

  const users = env['Community-Users'];
  const works = getWorks(env);
  const service = env['Community-Service'];

  const dict = await getTagDict(service);
  const types = sanitizePostTypes(type, dict);

  const id = await sha256(self.key + now + content.slice(0, 32));
  const payload = {
    title: (title || '').slice(0, 100),
    data: b64encode(content),
    writer: self.key,
    type: types,
    comments: [],
    like: 0,
    likedBy: [],
    createdAt: now
  };

  await works.put(postKey(id), JSON.stringify(payload));

  if (types.length) {
    const idx = await getPostIdx(service);
    addToIdx(idx, id, types);
    await savePostIdx(service, idx);
  }

  const me = self.session;
  me.posts.unshift(id);
  me.lastPostTime = now;
  await users.put(self.key, JSON.stringify(me));

  return ok({ id });
}