// @path: api/auth/reset-password.js
import { sha256 } from '../_libs/crypto.js';
import { ok, fail } from '../_libs/response.js';
import { checkCode, consumeCode } from '../_libs/verify.js';
import { loadSession } from '../_libs/session.js';
import { getSettings } from '../_libs/settings.js';

export async function onRequestPost({ request, env }) {
  const users = env['Community-Users'];
  const settings = await getSettings(env);
  const needVerify = !!settings.registerNeedEmailVerity;

  let body = {};
  try { body = await request.json(); } catch {}

  if (needVerify) {
    const { email, code, newPassword, confirmPassword } = body || {};
    if (!email || !code || !newPassword) return fail('缺少参数');
    if (newPassword !== confirmPassword) return fail('两次密码不一致');
    if (newPassword.length < 6) return fail('密码至少 6 位');

    const valid = await checkCode(env, 'reset', email, code);
    if (!valid) return fail('验证码错误或已过期');

    const target = await findByEmail(users, email);
    if (!target) return fail('用户不存在', 404);

    await applyPassword(users, target.session, target.key, newPassword);
    await consumeCode(env, 'reset', email);
    return ok({ message: '密码已重置，请登录' });
  }

  const found = await loadSession(env, request);
  if (!found) return fail('需要登录后才能修改密码', 401);

  const { oldPassword, newPassword, confirmPassword } = body || {};
  if (!oldPassword || !newPassword) return fail('缺少参数');
  if (newPassword !== confirmPassword) return fail('两次密码不一致');
  if (newPassword.length < 6) return fail('密码至少 6 位');

  const oldHash = await sha256(oldPassword);
  if (found.session.password !== oldHash) return fail('原密码错误', 400);

  await applyPassword(users, found.session, found.key, newPassword);
  return ok({ message: '密码已重置' });
}

async function findByEmail(users, email) {
  let cursor;
  do {
    const list = await users.list({ cursor });
    for (const k of list.keys) {
      if (!/^[0-9a-f]{64}$/.test(k.name)) continue;
      const raw = await users.get(k.name);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw);
        if (s.email === email) return { session: s, key: k.name };
      } catch {}
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);
  return null;
}

async function applyPassword(users, session, key, newPassword) {
  const next = { ...session };
  next.password = await sha256(newPassword);

  const newKey = await sha256(next.name + next.email + newPassword);
  if (newKey !== key) {
    const conflict = await users.get(newKey);
    if (conflict) throw new Error('冲突');
    await users.put(newKey, JSON.stringify(next));
    await users.delete(key);
  } else {
    await users.put(key, JSON.stringify(next));
  }
}