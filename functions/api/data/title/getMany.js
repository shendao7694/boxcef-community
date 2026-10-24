// @path: api/data/title/getMany.js
import { ok, fail } from '../../_libs/response.js';
import { getTitles } from '../../_libs/title.js';

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch {}
  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  if (!ids.length) return ok({ titles: {} });

  const service = env['Community-Service'];
  const titles = await getTitles(service);

  const out = {};
  for (const id of ids) {
    if (titles[id]) out[id] = titles[id];
  }
  return ok({ titles: out });
}