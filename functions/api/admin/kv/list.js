// @path: api/admin/kv/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

const BINDINGS = ['Community-Service', 'Community-Assets', 'Community-Works', 'Community-Users'];

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}

  const binding = String(body.binding || '');
  if (!BINDINGS.includes(binding)) return fail('无效的 binding');

  const prefix = body.prefix ? String(body.prefix) : undefined;
  const cursor = body.cursor ? String(body.cursor) : undefined;
  const limit = Math.min(1000, Math.max(1, Number(body.limit) || 100));

  const kv = env[binding];
  if (!kv) return fail('KV 未绑定', 500);

  const res = await kv.list({ prefix, cursor, limit });

  return ok({
    keys: res.keys.map(k => ({
      name: k.name,
      expiration: k.expiration || null,
      metadata: k.metadata || null
    })),
    cursor: res.cursor || null,
    list_complete: !!res.list_complete
  });
}