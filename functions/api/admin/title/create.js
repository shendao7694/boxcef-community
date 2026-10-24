// @path: api/admin/title/create.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getTitles, setTitles, randomTitleId, sanitizeTitle } from '../../_libs/title.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}

  const clean = sanitizeTitle(body);
  if (!clean) return fail('头衔名称不能为空');

  const service = env['Community-Service'];
  const titles = await getTitles(service);

  const id = randomTitleId(titles);
  titles[id] = clean;
  await setTitles(service, titles);

  return ok({ id, title: clean });
}