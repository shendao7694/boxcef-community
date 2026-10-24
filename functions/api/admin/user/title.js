// @path: api/admin/user/title.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getTitles } from '../../_libs/title.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { key, titleId, action } = body || {};
  if (!key) return fail('缺少用户 key');
  if (!titleId) return fail('缺少 titleId');
  if (!['add', 'remove'].includes(action)) return fail('无效的操作');

  const service = env['Community-Service'];
  const users = env['Community-Users'];
  const titles = await getTitles(service);
  if (!titles[titleId]) return fail('头衔不存在', 404);

  const raw = await users.get(key);
  if (!raw) return fail('用户不存在', 404);

  let user;
  try { user = JSON.parse(raw); } catch { return fail('数据损坏'); }

  const mine = user.title || { own: [], choose: '' };
  mine.own = Array.isArray(mine.own) ? mine.own.slice() : [];

  if (action === 'add') {
    if (!mine.own.includes(titleId)) mine.own.push(titleId);
  } else {
    mine.own = mine.own.filter(x => x !== titleId);
    if (mine.choose === titleId) mine.choose = '';
  }

  user.title = mine;
  await users.put(key, JSON.stringify(user));

  return ok({ title: user.title });
}