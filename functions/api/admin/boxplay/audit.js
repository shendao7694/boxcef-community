// @path: api/admin/boxplay/audit.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks } from '../../_libs/works.js';
import { readBoxplay, writeBoxplay } from '../../_libs/boxplay.js';
import { pushMessage } from '../../_libs/message.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);
  let body = {};
  try { body = await request.json(); } catch {}

  const { id, action, text } = body;
  if (!id || !['approve', 'reject', 'delete'].includes(action)) return fail('参数错误');

  const works = getWorks(env);
  const p = await readBoxplay(works, id);
  if (!p) return fail('不存在', 404);

  if (action === 'delete') {
    await works.delete(`boxplay:${id}`);
    const raw = await env['Community-Users'].get(p.writer);
    if (raw) {
      const u = JSON.parse(raw);
      u.boxplays = (u.boxplays || []).filter(x => x !== id);
      await env['Community-Users'].put(p.writer, JSON.stringify(u));
    }
  } else {
    p.status = action === 'approve' ? 'approved' : 'rejected';
    await writeBoxplay(works, id, p);
    await pushMessage(env, p.writer, action === 'approve' ? 3 : 2, {
      from: '', fromName: '', fromAvatar: 'COMMON:normal_avatar',
      boxplayId: id, createdAt: Date.now(), text: String(text || '')
    });
  }
  return ok();
}