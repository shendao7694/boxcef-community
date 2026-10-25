// @path: api/admin/advice/action.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getAdvice, setAdvice } from '../../_libs/advice.js';
import { pushMessage } from '../../_libs/message.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const idx = Number(body.index);
  const action = body.action;
  const text = body.text;
  if (!Number.isInteger(idx) || idx < 0) return fail('索引无效');
  if (!['accept', 'reject', 'delete', 'pending'].includes(action)) return fail('无效的操作');

  const service = env['Community-Service'];
  const list = await getAdvice(service);
  if (idx >= list.length) return fail('索引越界');

  if (action === 'delete') {
    list.splice(idx, 1);
  } else {
    list[idx].status = action === 'pending' ? 'pending' : (action === 'accept' ? 'accepted' : 'rejected');
    list[idx].handledAt = action === 'pending' ? null : Date.now();
    if (action === 'accept' || action === 'reject') {
      await pushMessage(env, list[idx].from, action === 'accept' ? 8 : 9, {
        from: '', fromName: '', fromAvatar: 'COMMON:normal_avatar',
        adviceIndex: idx, createdAt: Date.now(), text: String(text || '')
      });
    }
  }

  await setAdvice(service, list);
  return ok();
}