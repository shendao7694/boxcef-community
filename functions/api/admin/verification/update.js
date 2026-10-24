// @path: api/admin/verification/update.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { key, action, code, expire, ttl } = body || {};
  if (!key || !key.startsWith('verification:')) return fail('无效的 key');

  const service = env['Community-Service'];

  if (action === 'delete') {
    await service.delete(key);
    return ok();
  }

  const raw = await service.get(key);
  if (!raw) return fail('验证码不存在', 404);

  let data;
  try { data = JSON.parse(raw); } catch { return fail('数据损坏'); }

  if (code !== undefined) {
    const c = String(code).trim();
    if (!/^\d{4,8}$/.test(c)) return fail('验证码必须为 4-8 位数字');
    data.code = c;
  }
  if (expire !== undefined) {
    const e = Number(expire);
    if (!e || e < Date.now()) return fail('过期时间无效');
    data.expire = e;
  }

  let ttlSec = 300;
  if (ttl !== undefined) {
    const t = Number(ttl);
    if (t > 0) ttlSec = t;
  } else if (data.expire) {
    ttlSec = Math.max(60, Math.floor((data.expire - Date.now()) / 1000));
  }

  await service.put(key, JSON.stringify(data), { expirationTtl: ttlSec });
  return ok({ verification: { key, ...data } });
}