// @path: api/auth/login.js
import { sha256 } from '../_libs/crypto.js';
import { fail } from '../_libs/response.js';
import { buildSessionKey } from '../_libs/session.js';
import { getSettings } from '../_libs/settings.js';
import { signJwt } from '../_libs/jwt.js';
import { setCookieHeader } from '../_libs/cookie.js';

export async function onRequestPost({ request, env }) {
  const users = env['Community-Users'];
  let body;
  try { body = await request.json(); } catch { return fail('请求格式错误'); }

  const { name, email, password } = body || {};
  if (!name || !email || !password) return fail('缺少必要参数');

  const sessionKey = await buildSessionKey(name, email, password);
  const raw = await users.get(sessionKey);
  if (!raw) return fail('用户名、邮箱或密码错误', 401);

  const session = JSON.parse(raw);
  if (session.password !== await sha256(password)) {
    return fail('用户名、邮箱或密码错误', 401);
  }

  session.lastLoginTime = Date.now();
  session.lastLoginIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  await users.put(sessionKey, JSON.stringify(session));

  const settings = await getSettings(env);
  const ttl = (settings.tokenValidTime || 720) * 60;
  const token = await signJwt({ sessionId: sessionKey }, env.JWT_SECRET || 'change-me', ttl);

  return new Response(JSON.stringify({ success: true, token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setCookieHeader('token', token, { maxAge: ttl })
    }
  });
}