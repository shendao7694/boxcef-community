// @path: api/data/profile/disc-delete.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

export async function onRequestPost({ request, env }) {
  const found = await loadSession(env, request);
  if (!found) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const hashes = Array.isArray(body.hashes) ? body.hashes : [];
  if (!hashes.length) return fail('未选择要删除的图片');

  const me = found.session;
  const assets = env['Community-Assets'];
  const users = env['Community-Users'];

  me.imageDisc = (me.imageDisc || []).filter(h => !hashes.includes(h));

  for (const hash of hashes) {
    await assets.delete(hash);
  }

  await users.put(found.key, JSON.stringify(me));
  return ok({ imageDisc: me.imageDisc });
}