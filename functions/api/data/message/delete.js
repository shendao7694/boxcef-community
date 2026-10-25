// @path: api/data/message/delete.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);
  const me = self.session;
  me.messages = [];
  await env['Community-Users'].put(self.key, JSON.stringify(me));
  return ok({ unreadCount: 0 });
}