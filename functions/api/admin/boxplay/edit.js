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
  const { id, title, description, playurl, type, isInIframe } = body || {};
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const service = env['Community-Service'];
  const p = await readBoxplay(works, id);
  if (!p) return fail('作品不存在', 404);

  const oldType = boxplayTypeOf(p);
  let newType = oldType;

  if (type !== undefined) {
    if (typeof type !== 'string' || !type.trim()) return fail('缺少分类');
    newType = sanitizeBoxplayType(type);
  }

  if (title !== undefined) p.title = String(title).trim().slice(0, 50);
  if (description !== undefined) p.description = String(description).slice(0, 2000);
  if (playurl !== undefined) {
    const url = String(playurl).trim();
    if (!/^https?:\/\//.test(url)) return fail('游玩链接格式不正确');
    p.playurl = url;
  }
  if (isInIframe !== undefined) p.isInIframe = !!isInIframe;

  if (newType !== oldType) {
    p.type = newType;

    const idx = await getBoxplayIdx(service);
    removeFromIdx(idx, id, [oldType]);
    addToIdx(idx, id, [newType]);
    await saveBoxplayIdx(service, idx);
  }

  await writeBoxplay(works, id, p);

  return ok({ id, type: newType, isInIframe: !!p.isInIframe });
}
