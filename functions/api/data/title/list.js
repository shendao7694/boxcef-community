// @path: api/data/title/list.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getTitles } from '../../_libs/title.js';

export async function onRequestGet({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const service = env['Community-Service'];
  const titles = await getTitles(service);

  const mine = self.session.title || { own: [], choose: '' };
  const owned = (mine.own || []).map(id => ({ id, ...(titles[id] || {}) })).filter(t => t.name);

  return ok({
    titles,
    owned,
    choose: mine.choose || ''
  });
}