// @path: api/admin/boxplay/reply.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks } from '../../_libs/works.js';
import { readBoxplay } from '../../_libs/boxplay.js';
import { pushMessage } from '../../_libs/message.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);
  let body = {};
  try { body = await request.json(); } catch {}
  const { id, text } = body || {};
  if (!id || !text) return fail('参数错误');

  const works = getWorks(env);
  const p = await readBoxplay(works, id);
  if (!p) return fail('不存在', 404);
  if (p.status !== 'approved' && p.status !== 'rejected') return fail('作品尚未审核，无法回复', 400);

  await pushMessage(env, p.writer, p.status === 'approved' ? 3 : 2, {
    from: '', fromName: '', fromAvatar: 'COMMON:normal_avatar',
    boxplayId: id, createdAt: Date.now(), text: String(text)
  });
  return ok();
}