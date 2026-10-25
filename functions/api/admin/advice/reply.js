// @path: api/admin/advice/reply.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getAdvice } from '../../_libs/advice.js';
import { pushMessage } from '../../_libs/message.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);
  let body = {};
  try { body = await request.json(); } catch {}
  const { index, text } = body || {};
  if (!Number.isInteger(index) || !text) return fail('参数错误');

  const service = env['Community-Service'];
  const list = await getAdvice(service);
  if (!list[index]) return fail('不存在', 404);
  if (list[index].status !== 'accepted' && list[index].status !== 'rejected') return fail('建议尚未处理，无法回复', 400);

  await pushMessage(env, list[index].from, list[index].status === 'accepted' ? 8 : 9, {
    from: '', fromName: '', fromAvatar: 'COMMON:normal_avatar',
    adviceIndex: index, createdAt: Date.now(), text: String(text)
  });
  return ok();
}