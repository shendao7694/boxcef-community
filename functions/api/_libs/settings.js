// @path: api/_libs/settings.js
export const DEFAULT_ALLOWED_EMAIL = [
  '@qq.com',
  '@163.com',
  '@126.com',
  '@yeah.net',
  '@foxmail.com',
  '@139.com',
  '@189.cn',
  '@wo.cn',
  '@sina.com',
  '@sina.cn',
  '@gmail.com',
  '@outlook.com',
  '@hotmail.com',
  '@live.com',
  '@msn.com',
  '@icloud.com',
  '@mac.com',
  '@me.com',
  '@yahoo.com',
  '@proton.me',
  '@zoho.com',
  '@gmx.com',
  '@yandex.ru',
  '@aol.com'
];

function normalizeAllowedEmail(list) {
  const arr = Array.isArray(list) ? list : DEFAULT_ALLOWED_EMAIL;
  const out = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    let s = item.trim().toLowerCase();
    if (!s) continue;
    if (!s.startsWith('@')) s = '@' + s;
    if (!/^@[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) continue;
    if (!out.includes(s)) out.push(s);
  }
  if (!out.length && arr.length) return DEFAULT_ALLOWED_EMAIL.slice();
  return out;
}

export function isEmailAllowed(settings, email) {
  const list = Array.isArray(settings?.allowedEmail) ? settings.allowedEmail : [];
  if (!list.length) return true;
  const value = String(email || '').trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at < 0) return false;
  const domain = value.slice(at);
  return list.some(suffix => domain === suffix || domain.endsWith('.' + suffix.slice(1)));
}

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
      boxPlayVaildText: 'BoxPlay 服务暂时关闭',
      allowedEmail: DEFAULT_ALLOWED_EMAIL.slice()
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
  s.allowedEmail = normalizeAllowedEmail(s.allowedEmail);

  return s;
}

export async function setSettings(env, patch) {
  const kv = env['Community-Service'];
  const cur = await getSettings(env);
  const next = { ...cur, ...patch };
  if (patch.allowedEmail !== undefined) next.allowedEmail = normalizeAllowedEmail(patch.allowedEmail);
  await kv.put('globalSettings', JSON.stringify(next));
  return next;
}