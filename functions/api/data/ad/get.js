// @path: api/data/ad/get.js
import { ok } from '../../_libs/response.js';
import { b64decode } from '../../_libs/works.js';
import { getAds } from '../../_libs/ad.js';

export async function onRequestGet({ env }) {
  const service = env['Community-Service'];
  const list = await getAds(service);

  const out = list
    .filter(x => x && (x.image || x.text))
    .map(x => ({
      image: x.image || '',
      text: x.text ? safeDecode(x.text) : '',
      link: x.link || ''
    }));

  return ok({ ads: out });
}

function safeDecode(b64) {
  try { return b64decode(b64); } catch { return ''; }
}