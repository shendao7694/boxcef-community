// @path: api/works/boxplay/delete.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getWorks } from '../../_libs/works.js';
import { readBoxplay, boxplayKey } from '../../_libs/boxplay.js';
import { getBoxplayIdx, saveBoxplayIdx, removeFromIdx } from '../../_libs/postIdx.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id } = body;
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const p = await readBoxplay(works, id);
  if (!p) return fail('作品不存在', 404);
  if (p.writer !== self.key) return fail('无权限', 403);

  await works.delete(boxplayKey(id));

  const idx = await getBoxplayIdx(env['Community-Service']);
  removeFromIdx(idx, id);
  await saveBoxplayIdx(env['Community-Service'], idx);

  self.session.boxplays = (self.session.boxplays || []).filter(x => x !== id);
  await env['Community-Users'].put(self.key, JSON.stringify(self.session));

  return ok();
}