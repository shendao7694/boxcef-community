// @path: api/data/advice/create.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getAdvice, setAdvice } from '../../_libs/advice.js';
import { b64encode } from '../../_libs/works.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const service = env['Community-Service'];
  const cooldownKey = `adviceCooldown:${self.key}`;
  if (await service.get(cooldownKey)) {
    return fail('发送过于频繁，请 60 秒后再试', 429);
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const content = String(body.content || '').trim();
  if (!content) return fail('内容不能为空');
  if (content.length > 5000) return fail('内容过长');

  const list = await getAdvice(service);
  list.unshift({
    from: self.key,
    content: b64encode(content),
    status: 'pending',
    createdAt: Date.now(),
    handledAt: null
  });
  if (list.length > 500) list.length = 500;
  await setAdvice(service, list);

  await service.put(cooldownKey, String(Date.now()), { expirationTtl: 60 });

  return ok();
}