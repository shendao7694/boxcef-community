// @path: api/data/message/list.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

export async function onRequestGet({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);
  const messages = self.session.messages || [];
  const unreadCount = messages.filter(m => !m.read).length;
  return ok({ messages, unreadCount });
}