// @path: api/data/advice/list.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getAdvice } from '../../_libs/advice.js';
import { b64decode } from '../../_libs/works.js';

export async function onRequestGet({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const service = env['Community-Service'];
  const list = await getAdvice(service);

  const mine = [];
  list.forEach((a, i) => {
    if (a.from !== self.key) return;
    mine.push({
      idx: i,
      content: safeDecode(a.content),
      status: a.status || 'pending',
      createdAt: a.createdAt || 0,
      handledAt: a.handledAt || null
    });
  });

  return ok({ advice: mine });
}

function safeDecode(b64) {
  try { return b64decode(b64); } catch { return ''; }
}