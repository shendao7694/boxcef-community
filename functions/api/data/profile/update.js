// @path: api/data/profile/update.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

export async function onRequestPost({ request, env }) {
  const found = await loadSession(env, request);
  if (!found) return fail('未登录', 401);

  let body;
  try { body = await request.json(); } catch { return fail('请求格式错误'); }
  const { nickname, description } = body || {};

  if (nickname !== undefined) {
    const n = String(nickname).trim();
    if (n.length < 1 || n.length > 20) return fail('昵称长度 1-20');
    found.session.nickname = n;
  }
  if (description !== undefined) {
    const d = String(description);
    if (d.length > 200) return fail('简介最多 200 字');
    found.session.description = d;
  }

  await env['Community-Users'].put(found.key, JSON.stringify(found.session));
  const { password, ...safe } = found.session;
  return ok({ user: safe });
}