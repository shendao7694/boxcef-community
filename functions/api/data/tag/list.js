// @path: api/data/tag/list.js
import { ok } from '../../_libs/response.js';
import { getTagDict, BOXPLAY_TYPES } from '../../_libs/postIdx.js';

export async function onRequestGet({ env }) {
  const service = env['Community-Service'];
  const postTags = await getTagDict(service);
  return ok({ postTags, boxplayTypes: BOXPLAY_TYPES });
}
