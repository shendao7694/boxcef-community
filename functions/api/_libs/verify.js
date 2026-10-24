// @path: api/_libs/verify.js
export function verifyKey(purpose, email) {
  return `verification:${purpose}:${email}`;
}

export function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function putCode(env, purpose, email, code, ttl = 300) {
  const kv = env['Community-Service'];
  await kv.put(
    verifyKey(purpose, email),
    JSON.stringify({ code, expire: Date.now() + ttl * 1000, purpose }),
    { expirationTtl: ttl }
  );
}

export async function checkCode(env, purpose, email, code) {
  const kv = env['Community-Service'];
  const raw = await kv.get(verifyKey(purpose, email));
  if (!raw) return false;
  let data;
  try { data = JSON.parse(raw); } catch { return false; }
  if (data.code !== code) return false;
  if (Date.now() > data.expire) return false;
  return true;
}

export async function consumeCode(env, purpose, email) {
  const kv = env['Community-Service'];
  await kv.delete(verifyKey(purpose, email));
}