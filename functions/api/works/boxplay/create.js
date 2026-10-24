// @path: api/works/boxplay/create.js
import { sha256 } from '../../_libs/crypto.js';
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getWorks } from '../../_libs/works.js';
import { writeBoxplay } from '../../_libs/boxplay.js';
import { getSettings } from '../../_libs/settings.js';
import { readUserLimit } from '../../_libs/limit.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const settings = await getSettings(env);
  const limit = readUserLimit(self.session, settings);
  const now = Date.now();

  // 冷却检查
  if (now - (self.session.lastBoxPlayTime || 0) < limit.publishBoxPlayCooling * 1000) {
    return fail(`发布过于频繁，请等待 ${limit.publishBoxPlayCooling} 秒`, 429);
  }

  // 数量限制检查
  self.session.boxplays = self.session.boxplays || [];
  // 这里判断逻辑：最多拥有 N 个
  if (self.session.boxplays.length >= limit.publishBoxPlayMax) {
    return fail(`你最多只能发布 ${limit.publishBoxPlayMax} 个 BoxPlay 作品`, 400);
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const { title, description, cover, playurl } = body || {};

  if (!title || !cover || !playurl) return fail('标题、封面和链接不能为空');
  if (!/^https?:\/\//.test(playurl)) return fail('游玩链接格式不正确');

  const works = getWorks(env);
  const id = await sha256(self.key + now + title);
  
  const payload = {
    title: title.slice(0, 50),
    description: (description || '').slice(0, 2000),
    cover,
    playurl,
    writer: self.key,
    status: 'pending', // pending, approved
    comments: [],
    createdAt: now
  };

  await writeBoxplay(works, id, payload);

  self.session.boxplays.push(id);
  self.session.lastBoxPlayTime = now;
  await env['Community-Users'].put(self.key, JSON.stringify(self.session));

  return ok({ id, message: '提交成功，请等待管理员审核' });
}