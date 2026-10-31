// @path: api/_libs/postIdx.js
export const POST_TYPES = ['日常', '求助', '公告', '教程', '技术'];
export const BOXPLAY_TYPES = ['跑酷', '休闲', '竞速', '竞技', '创造', '模拟经营', '角色扮演', '生存冒险', '解密探险', '其他'];
export const POST_IDX_KEY = 'postIdx';
export const BOXPLAY_IDX_KEY = 'boxplayIdx';
export const TAG_DICT_KEY = 'postTags';
export const MAX_POST_TAGS = 5;

export async function getPostIdx(service) {
  const raw = await service.get(POST_IDX_KEY, { type: 'json' });
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

export async function savePostIdx(service, idx) {
  await service.put(POST_IDX_KEY, JSON.stringify(idx));
}

export async function getBoxplayIdx(service) {
  const raw = await service.get(BOXPLAY_IDX_KEY, { type: 'json' });
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

export async function saveBoxplayIdx(service, idx) {
  await service.put(BOXPLAY_IDX_KEY, JSON.stringify(idx));
}

export async function getTagDict(service) {
  const raw = await service.get(TAG_DICT_KEY, { type: 'json' });
  const dict = [...POST_TYPES];
  if (Array.isArray(raw)) {
    for (const t of raw) {
      if (typeof t === 'string' && t.trim() && !dict.includes(t.trim())) dict.push(t.trim());
    }
  }
  return dict;
}

export async function getCustomTags(service) {
  const raw = await service.get(TAG_DICT_KEY, { type: 'json' });
  if (!Array.isArray(raw)) return [];
  return raw.filter(t => typeof t === 'string' && t.trim() && !POST_TYPES.includes(t.trim()));
}

export async function saveCustomTags(service, tags) {
  const clean = [];
  for (const t of tags) {
    if (typeof t !== 'string') continue;
    const v = t.trim().slice(0, 12);
    if (v && !clean.includes(v) && !POST_TYPES.includes(v)) clean.push(v);
  }
  await service.put(TAG_DICT_KEY, JSON.stringify(clean));
  return clean;
}

export function sanitizePostTypes(raw, dict) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const t of raw) {
    if (typeof t !== 'string') continue;
    const v = t.trim().slice(0, 12);
    if (v && dict.includes(v) && !out.includes(v)) out.push(v);
  }
  return out.slice(0, MAX_POST_TAGS);
}

export function sanitizeBoxplayType(raw) {
  const v = typeof raw === 'string' ? raw.trim() : '';
  return BOXPLAY_TYPES.includes(v) ? v : '其他';
}

export function postTypesOf(post) {
  return Array.isArray(post.type) ? post.type.filter(t => typeof t === 'string' && t) : [];
}

export function boxplayTypeOf(boxplay) {
  return typeof boxplay.type === 'string' && boxplay.type ? boxplay.type : '其他';
}

export function addToIdx(idx, id, keys) {
  for (const key of keys) {
    if (!idx[key]) idx[key] = [];
    if (!idx[key].includes(id)) idx[key].push(id);
  }
}

export function removeFromIdx(idx, id, keys) {
  const targets = keys || Object.keys(idx);
  for (const key of targets) {
    if (!idx[key]) continue;
    idx[key] = idx[key].filter(x => x !== id);
    if (!idx[key].length) delete idx[key];
  }
}
