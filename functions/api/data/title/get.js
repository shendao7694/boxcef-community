// @path: api/data/title/get.js
import { ok, fail } from '../../_libs/response.js';
import { getTitles } from '../../_libs/title.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!id) return fail('缺少 id');

  const service = env['Community-Service'];
  const titles = await getTitles(service);
  const t = titles[id];
  if (!t) return fail('头衔不存在', 404);

  return ok({ id, title: t });
}