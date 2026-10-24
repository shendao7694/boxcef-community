// @path: api/admin/kv/put.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

const BINDINGS = ['Community-Service', 'Community-Assets', 'Community-Works', 'Community-Users'];

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}

  const binding = String(body.binding || '');
  if (!BINDINGS.includes(binding)) return fail('无效的 binding');
  const key = String(body.key || '');
  if (!key) return fail('缺少 key');

  const value = body.value === undefined || body.value === null ? '' : String(body.value);

  const kv = env[binding];
  if (!kv) return fail('KV 未绑定', 500);

  const options = {};
  if (body.expiration) {
    const exp = Number(body.expiration);
    if (exp > 0) options.expiration = exp;
  }
  if (body.expirationTtl) {
    const ttl = Number(body.expirationTtl);
    if (ttl >= 60) options.expirationTtl = ttl;
  }

  await kv.put(key, value, options);
  return ok({ key, size: value.length });
}