// @path: api/admin/tag/update.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getCustomTags, saveCustomTags } from '../../_libs/postIdx.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { action, tag } = body || {};
  if (!['add', 'remove'].includes(action)) return fail('参数错误');
  if (typeof tag !== 'string' || !tag.trim()) return fail('缺少 tag');

  const service = env['Community-Service'];
  const custom = await getCustomTags(service);
  const value = tag.trim().slice(0, 12);

  let next;
  if (action === 'add') {
    if (custom.includes(value)) return fail('该标签已存在');
    next = [...custom, value];
  } else {
    next = custom.filter(t => t !== value);
  }

  const saved = await saveCustomTags(service, next);
  return ok({ custom: saved });
}
