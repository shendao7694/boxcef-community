// @path: api/auth/me.js
import { ok, fail } from '../_libs/response.js';
import { loadSession } from '../_libs/session.js';
import { getSettings } from '../_libs/settings.js';
import { ensureUserLimit } from '../_libs/limit.js';

export async function onRequestGet({ request, env }) {
  const found = await loadSession(env, request);
  if (!found) return fail('未登录或 token 已失效', 401);

  const settings = await getSettings(env);
  if (Date.now() - found.session.lastLoginTime > settings.tokenValidTime * 60 * 1000) {
    return fail('登录已过期，请重新登录', 401);
  }

  await ensureUserLimit(env, found.session, found.key);

  const unreadCount = (found.session.messages || []).filter(m => !m.read).length;
  const { password, ...safe } = found.session;
  return ok({ user: { ...safe, sessionKey: found.key, unreadCount } });
}