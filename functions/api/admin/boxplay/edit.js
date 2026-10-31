// @path: api/admin/boxplay/edit.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks } from '../../_libs/works.js';
import { readBoxplay, writeBoxplay } from '../../_libs/boxplay.js';
import { sanitizeBoxplayType, getBoxplayIdx, saveBoxplayIdx, addToIdx, removeFromIdx, boxplayTypeOf } from '../../_libs/postIdx.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, type } = body || {};
  if (!id) return fail('缺少 id');
  if (typeof type !== 'string' || !type.trim()) return fail('缺少分类');

  const works = getWorks(env);
  const service = env['Community-Service'];
  const p = await readBoxplay(works, id);
  if (!p) return fail('作品不存在', 404);

  const oldType = boxplayTypeOf(p);
  const newType = sanitizeBoxplayType(type);

  if (newType !== oldType) {
    p.type = newType;
    await writeBoxplay(works, id, p);

    const idx = await getBoxplayIdx(service);
    removeFromIdx(idx, id, [oldType]);
    addToIdx(idx, id, [newType]);
    await saveBoxplayIdx(service, idx);
  }

  return ok({ id, type: newType });
}
