// @path: api/_libs/session.js
import { sha256 } from './crypto.js';
import { verifyJwt } from './jwt.js';
import { readCookie } from './cookie.js';

export function getBearer(request) {
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}

export function getToken(request) {
  return readCookie(request, 'token') || getBearer(request) || '';
}

export async function buildSessionKey(name, email, password) {
  return sha256(name + email + password);
}

export async function loadSession(env, request) {
  const token = getToken(request);
  if (!token) return null;
  const payload = await verifyJwt(token, env.JWT_SECRET || 'change-me');
  if (!payload || !payload.sessionId) return null;

  const users = env['Community-Users'];
  const raw = await users.get(payload.sessionId);
  if (!raw) return null;
  let session;
  try { session = JSON.parse(raw); } catch { return null; }
  return { key: payload.sessionId, session, token };
}