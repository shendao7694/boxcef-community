// @path: api/_libs/settings.js
export async function getSettings(env) {
  const kv = env['Community-Service'];
  let s = await kv.get('globalSettings', { type: 'json' });
  if (!s) {
    s = {
      registerNeedEmailVerity: 'true',
      tokenValidTime: 720,
      pinnedPosts: [],
      maxUploadSize: 100,
      buildUserIdxTime: 168,
      maxImageInDisc: 20,
      publishPostMax: 20,
      publishBoxPlayMax: 1,
      publishPostCooling: 60,
      publishBoxPlayCooling: 300,
      boxPlayStatus: true,
      boxPlayVaildText: 'BoxPlay 服务暂时关闭'
    };
    await kv.put('globalSettings', JSON.stringify(s));
  }
  if (!Array.isArray(s.pinnedPosts)) s.pinnedPosts = [];
  if (typeof s.maxUploadSize !== 'number' || s.maxUploadSize <= 0) s.maxUploadSize = 100;
  if (typeof s.buildUserIdxTime !== 'number' || s.buildUserIdxTime <= 0) s.buildUserIdxTime = 168;
  if (typeof s.maxImageInDisc !== 'number' || s.maxImageInDisc <= 0) s.maxImageInDisc = 20;
  if (typeof s.publishPostMax !== 'number' || s.publishPostMax <= 0) s.publishPostMax = 20;
  if (typeof s.publishBoxPlayMax !== 'number' || s.publishBoxPlayMax <= 0) s.publishBoxPlayMax = 1;
  if (typeof s.publishPostCooling !== 'number' || s.publishPostCooling < 0) s.publishPostCooling = 60;
  if (typeof s.publishBoxPlayCooling !== 'number' || s.publishBoxPlayCooling < 0) s.publishBoxPlayCooling = 300;
  
  
  if (typeof s.boxPlayStatus !== 'boolean') s.boxPlayStatus = true;
  if (typeof s.boxPlayVaildText !== 'string') s.boxPlayVaildText = 'BoxPlay 服务暂时关闭';

  return s;
}

export async function setSettings(env, patch) {
  const kv = env['Community-Service'];
  const cur = await getSettings(env);
  const next = { ...cur, ...patch };
  await kv.put('globalSettings', JSON.stringify(next));
  return next;
}