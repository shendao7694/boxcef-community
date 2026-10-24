// @path: api/auth/register.js
import { sha256 } from '../_libs/crypto.js';
import { fail } from '../_libs/response.js';
import { buildSessionKey } from '../_libs/session.js';
import { checkCode, consumeCode } from '../_libs/verify.js';
import { getSettings } from '../_libs/settings.js';
import { signJwt } from '../_libs/jwt.js';
import { setCookieHeader } from '../_libs/cookie.js';

export async function onRequestPost({ request, env }) {
  const users = env['Community-Users'];
  let body;
  try { body = await request.json(); } catch { return fail('请求格式错误'); }

  const { name, nickname, email, password, confirmPassword, code } = body || {};
  if (!name || !email || !password) return fail('缺少必要参数');
  if (name.length < 2 || name.length > 20) return fail('用户名长度 2-20');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('邮箱格式错误');
  if (password.length < 6) return fail('密码至少 6 位');
  if (password !== confirmPassword) return fail('两次密码不一致');

  const settings = await getSettings(env);
  if (settings.registerNeedEmailVerity) {
    if (!code) return fail('请输入邮箱验证码');
    if (!await checkCode(env, 'register', email, code)) return fail('验证码错误或已过期');
  }

  const sessionKey = await buildSessionKey(name, email, password);
  if (await users.get(sessionKey)) return fail('该用户已存在');

  let cursor;
  do {
    const list = await users.list({ cursor });
    for (const k of list.keys) {
      if (!/^[0-9a-f]{64}$/.test(k.name)) continue;
      const raw = await users.get(k.name);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw);
        if (s.email === email) return fail('该邮箱已被注册');
        if (s.name === name) return fail('该用户名已被占用');
      } catch {}
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const session = {
    name,
    nickname: nickname || name,
    email,
    password: await sha256(password),
    group: 'user',
    avatar: 'COMMON:normal_avatar',
    description: '',
    posts: [],
    title: { own: [], choose: '' },
    social: { following: [], followers: [], mutual: [] },
    imageDisc: [],
    limit: {
      maxUploadSize: settings.maxUploadSize ?? 100,
      maxImageInDisc: settings.maxImageInDisc ?? 20,
      publishPostMax: settings.publishPostMax ?? 20,
      publishBoxPlayMax: settings.publishBoxPlayMax ?? 1,
      publishPostCooling: settings.publishPostCooling ?? 60,
      publishBoxPlayCooling: settings.publishBoxPlayCooling ?? 300
    },
    lastLoginTime: Date.now(),
    lastLoginIp: ip
  };

  await users.put(sessionKey, JSON.stringify(session));

  const ttl = (settings.tokenValidTime || 720) * 60;
  const token = await signJwt({ sessionId: sessionKey }, env.JWT_SECRET || 'change-me', ttl);

  if (settings.registerNeedEmailVerity) {
    await consumeCode(env, 'register', email);
  }

  return new Response(JSON.stringify({ success: true, token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setCookieHeader('token', token, { maxAge: ttl })
    }
  });
}