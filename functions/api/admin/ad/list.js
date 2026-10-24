// @path: api/admin/ad/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getAds } from '../../_libs/ad.js';
import { b64decode } from '../../_libs/works.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const service = env['Community-Service'];
  const list = await getAds(service);

  return ok({
    ads: list.map((x, i) => ({
      idx: i,
      image: x.image || '',
      text: x.text ? safeDecode(x.text) : '',
      link: x.link || ''
    }))
  });
}

function safeDecode(b64) {
  try { return b64decode(b64); } catch { return ''; }
}