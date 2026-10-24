// @path: api/admin/ad/update.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getAds, setAds } from '../../_libs/ad.js';
import { b64encode, b64decode } from '../../_libs/works.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { action } = body || {};
  const service = env['Community-Service'];
  let list = await getAds(service);

  if (action === 'add') {
    list.push({ image: '', text: '', link: '' });
  } else if (action === 'delete') {
    const idx = Number(body.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) return fail('索引无效');
    list.splice(idx, 1);
  } else if (action === 'move') {
    const idx = Number(body.index);
    const dir = body.direction;
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) return fail('索引无效');
    if (dir !== 'up' && dir !== 'down') return fail('方向无效');
    const to = dir === 'up' ? idx - 1 : idx + 1;
    if (to < 0 || to >= list.length) return ok({ ads: list });
    [list[idx], list[to]] = [list[to], list[idx]];
  } else if (action === 'update') {
    const idx = Number(body.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) return fail('索引无效');
    const item = list[idx];
    if (body.image !== undefined) item.image = String(body.image).trim();
    if (body.text !== undefined) item.text = b64encode(String(body.text));
    if (body.link !== undefined) item.link = String(body.link).trim();
  } else {
    return fail('无效的操作');
  }

  await setAds(service, list);
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