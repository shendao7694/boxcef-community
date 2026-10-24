// @path: api/_libs/title.js
export async function getTitles(service) {
  const raw = await service.get('title');
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export async function setTitles(service, data) {
  await service.put('title', JSON.stringify(data));
}

export function randomTitleId(existing) {
  for (let i = 0; i < 100; i++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    if (!existing[id]) return id;
  }
  throw new Error('无法生成唯一头衔 id');
}

export function sanitizeTitle(t) {
  if (!t) return null;
  const name = String(t.name || '').slice(0, 20);
  if (!name) return null;
  const bg = t.background || {};
  let type = bg.type === 'image' ? 'image' : 'color';
  let data = String(bg.data || '').trim();
  if (type === 'image') {
    if (!data) return { name, background: { type: 'color', data: '#000000' } };
  } else {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(data)) data = '#000000';
    type = 'color';
  }
  return { name, background: { type, data } };
}