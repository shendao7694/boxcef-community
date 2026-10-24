// @path: api/auth/send-code.js
import { ok, fail } from '../_libs/response.js';
import { sendEmail } from '../_libs/mail.js';
import { genCode, putCode, verifyKey } from '../_libs/verify.js';

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch {}
  const { email, purpose } = body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail('邮箱格式错误');
  }
  if (!purpose || !['register', 'reset'].includes(purpose)) {
    return fail('purpose 无效');
  }

  const kv = env['Community-Service'];

  const existing = await kv.get(verifyKey(purpose, email));
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed.expire && parsed.expire - Date.now() > 4 * 60 * 1000) {
        return fail('验证码发送过于频繁，请稍后再试', 429);
      }
    } catch {}
  }

  if (purpose === 'register') {
    let cursor;
    let exists = false;
    do {
      const list = await kv.list({ cursor });
      for (const k of list.keys) {
        if (!/^[0-9a-f]{64}$/.test(k.name)) continue;
        const raw = await kv.get(k.name);
        if (!raw) continue;
        try {
          const s = JSON.parse(raw);
          if (s.email === email) { exists = true; break; }
        } catch {}
      }
      cursor = list.cursor;
      if (list.list_complete || exists) break;
    } while (cursor);
    if (exists) return fail('该邮箱已被注册');
  }

  if (purpose === 'reset') {
    let cursor;
    let exists = false;
    do {
      const list = await kv.list({ cursor });
      for (const k of list.keys) {
        if (!/^[0-9a-f]{64}$/.test(k.name)) continue;
        const raw = await kv.get(k.name);
        if (!raw) continue;
        try {
          const s = JSON.parse(raw);
          if (s.email === email) { exists = true; break; }
        } catch {}
      }
      cursor = list.cursor;
      if (list.list_complete || exists) break;
    } while (cursor);
    if (!exists) return fail('该邮箱未注册');
  }

  const code = genCode();
  const sent = await sendEmail(email, code, env);
  if (!sent) return fail('邮件发送失败，请稍后再试', 500);

  await putCode(env, purpose, email, code, 300);
  return ok({ message: '验证码已发送' });
}