// @path: api/data/advice/delete.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getAdvice, setAdvice } from '../../_libs/advice.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const idx = Number(body.index);
  if (!Number.isInteger(idx) || idx < 0) return fail('索引无效');

  const service = env['Community-Service'];
  const list = await getAdvice(service);
  if (idx >= list.length) return fail('索引越界');
  if (list[idx].from !== self.key) return fail('无权限', 403);

  list.splice(idx, 1);
  await setAdvice(service, list);
  return ok();
}