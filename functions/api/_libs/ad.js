// @path: api/_libs/ad.js
export async function getAds(service) {
  const raw = await service.get('ad');
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function setAds(service, list) {
  await service.put('ad', JSON.stringify(list));
}