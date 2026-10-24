// @path: api/data/title/choose.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');

  const users = env['Community-Users'];
  const me = self.session;
  const mine = me.title || { own: [], choose: '' };

  if (id === '') {
    me.title = { own: mine.own || [], choose: '' };
  } else {
    if (!(mine.own || []).includes(id)) return fail('你没有这个头衔');
    me.title = { own: mine.own || [], choose: id };
  }

  await users.put(self.key, JSON.stringify(me));
  return ok({ title: me.title });
}