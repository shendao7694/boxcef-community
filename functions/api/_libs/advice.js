// @path: api/_libs/advice.js
export async function getAdvice(service) {
  const raw = await service.get('advice');
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function setAdvice(service, list) {
  await service.put('advice', JSON.stringify(list));
}