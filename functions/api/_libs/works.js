// @path: api/_libs/works.js
export const WORKS_BINDING = 'Community-Works';
export const USERS_BINDING = 'Community-Users';

export function getWorks(env) {
  const works = env[WORKS_BINDING];
  if (!works) throw new Error(`KV binding "${WORKS_BINDING}" not found`);
  return works;
}

export function getUsers(env) {
  const users = env[USERS_BINDING];
  if (!users) throw new Error(`KV binding "${USERS_BINDING}" not found`);
  return users;
}

export function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function b64decode(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function postKey(id) {
  return `post:${id}`;
}

export async function readPost(works, id) {
  const raw = await works.get(postKey(id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function writePost(works, id, data) {
  await works.put(postKey(id), JSON.stringify(data));
}

export async function getUserBySessionId(serviceOrEnv, sessionKey) {
  
  const users = serviceOrEnv && typeof serviceOrEnv.get === 'function'
    ? serviceOrEnv
    : null;
  if (!users) return null;
  const raw = await users.get(sessionKey);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function publicUser(s, key) {
  return {
    key,
    name: s.name,
    nickname: s.nickname,
    avatar: s.avatar,
    group: s.group,
    title: s.title || null
  };
}

export function safeDecode(b64) {
  try { return b64decode(b64); } catch { return ''; }
}