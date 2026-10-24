// @path: api/admin/user/create.js
import { sha256 } from '../../_libs/crypto.js';
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings } from '../../_libs/settings.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}

  const { name, nickname, email, password, group, description, avatar } = body || {};
  if (!name || !email || !password) return fail('缺少必要参数');

  const n = String(name).trim();
  const e = String(email).trim();
  const p = String(password);

  if (n.length < 2 || n.length > 20) return fail('用户名长度 2-20');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return fail('邮箱格式错误');
  if (p.length < 6) return fail('密码至少 6 位');

  const users = env['Community-Users'];

  const sessionKey = await sha256(n + e + p);
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
        if (s.email === e) return fail('该邮箱已被注册');
        if (s.name === n) return fail('该用户名已被占用');
      } catch {}
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const settings = await getSettings(env);

  const session = {
    name: n,
    nickname: (nickname && String(nickname).trim()) || n,
    email: e,
    password: await sha256(p),
    group: (group && String(group).trim()) || 'user',
    avatar: (avatar && String(avatar).trim()) || 'COMMON:normal_avatar',
    description: description ? String(description) : '',
    posts: [],
    title: { own: [], choose: '' },
    social: { following: [], followers: [], mutual: [] },
    imageDisc: [],
    limit: {
      maxUploadSize: settings.maxUploadSize ?? 100,
      maxImageInDisc: settings.maxImageInDisc ?? 20
    },
    lastLoginTime: Date.now(),
    lastLoginIp: ip
  };

  await users.put(sessionKey, JSON.stringify(session));

  const { password: _, ...safe } = session;
  return ok({ user: safe, key: sessionKey });
}