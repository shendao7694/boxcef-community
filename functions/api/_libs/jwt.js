// @path: api/_libs/jwt.js
function b64u(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64uDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function key(secret) {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
}

async function sign(data, secret) {
  const k = await key(secret);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(data));
  return b64u(sig);
}

export async function signJwt(payload, secret, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify({ ...payload, iat: now, exp: now + (ttlSeconds || 720 * 60) }));
  const data = `${header}.${body}`;
  return `${data}.${await sign(data, secret)}`;
}

export async function verifyJwt(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = await sign(`${h}.${p}`, secret);
  if (expected.length !== s.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ s.charCodeAt(i);
  if (diff !== 0) return null;
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(b64uDecode(p))); } catch { return null; }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}