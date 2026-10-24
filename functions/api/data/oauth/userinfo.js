// @path: api/data/oauth/userinfo.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const sessionKey = self.key;
  const user = self.session;

  let body = {};
  try { body = await request.json(); } catch {}
  const scopes = Array.isArray(body.scope) ? body.scope : [];
  const isAll = scopes.includes('user:all');

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
  const out = {};

  if (isAll || scopes.includes('user:token')) out.token = self.token || '';
  if (isAll || scopes.includes('user:session')) out.session = sessionKey;
  if (isAll || scopes.includes('user:name')) out.name = user.nickname || user.name || '';
  if (isAll || scopes.includes('user:email')) out.email = user.email || '';
  if (isAll || scopes.includes('user:group')) out.group = user.group || 'user';
  if (isAll || scopes.includes('user:ip')) out.ip = ip;

  return ok({ user: out });
}