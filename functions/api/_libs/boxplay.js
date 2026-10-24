// @path: api/_libs/boxplay.js
export function boxplayKey(id) { return `boxplay:${id}`; }

export async function readBoxplay(works, id) {
  const raw = await works.get(boxplayKey(id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function writeBoxplay(works, id, data) {
  await works.put(boxplayKey(id), JSON.stringify(data));
}

export function boxplayHotScore(p, now) {
  const comments = (p.comments || []).length;
  const ageHours = Math.max(1, (now - (p.createdAt || now)) / 3600000);
  return (comments * 2 + 1) / Math.pow(ageHours + 2, 0.6);
}