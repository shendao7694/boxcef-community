// @path: api/admin/title/update.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getTitles, setTitles, sanitizeTitle } from '../../_libs/title.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const id = String(body.id || '');
  if (!id) return fail('缺少 id');

  const service = env['Community-Service'];
  const titles = await getTitles(service);
  if (!titles[id]) return fail('头衔不存在', 404);

  if (body.action === 'delete') {
    delete titles[id];
    await setTitles(service, titles);
    return ok();
  }

  const clean = sanitizeTitle(body);
  if (!clean) return fail('头衔名称不能为空');
  titles[id] = clean;
  await setTitles(service, titles);
  return ok({ id, title: clean });
}