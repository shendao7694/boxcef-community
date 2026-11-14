// @path: api/data/profile/delete.js
import { fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { sha256 } from '../../_libs/crypto.js';
import { checkCode, consumeCode } from '../../_libs/verify.js';
import { clearCookieHeader } from '../../_libs/cookie.js';
import { mapLimit } from '../../_libs/works.js';

async function collectKeys(kv, prefix) {
  const keys = [];
  let cursor;
  do {
    const list = await kv.list({ cursor, prefix });
    for (const key of list.keys) keys.push(key.name);
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);
  return keys;
}

async function removeUserWorks(env, writerKey) {
  const works = env['Community-Works'];
  if (!works) return;

  const postKeys = await collectKeys(works, 'post:');
  const boxKeys = await collectKeys(works, 'boxplay:');

  await mapLimit(postKeys, 10, async (key) => {
    const raw = await works.get(key);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.writer === writerKey) await works.delete(key);
    } catch {}
  });

  await mapLimit(boxKeys, 10, async (key) => {
    const raw = await works.get(key);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.writer === writerKey) await works.delete(key);
    } catch {}
  });
}

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}

  const { code, name, email, password } = body || {};
  if (!code || !name || !email || !password) return fail('缺少参数');

  const session = self.session;
  if (String(name).trim() !== session.name) return fail('用户名不匹配');
  if (String(email).trim() !== session.email) return fail('邮箱不匹配');

  const passwordHash = await sha256(String(password));
  if (passwordHash !== session.password) return fail('密码错误');

  const valid = await checkCode(env, 'delete', session.email, String(code).trim());
  if (!valid) return fail('验证码错误或已过期');

  const users = env['Community-Users'];
  const assets = env['Community-Assets'];

  if (session.avatar && session.avatar !== 'COMMON:normal_avatar') {
    await assets.delete(session.avatar);
  }

  await removeUserWorks(env, self.key);
  await users.delete(self.key);
  await consumeCode(env, 'delete', session.email);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookieHeader('token', { domain: env.COOKIE_DOMAIN })
    }
  });
}
