// @path: src/js/common/auth.js
import { request, clearToken, getToken } from './api.js';

const ME_TTL = 60 * 1000;

let _mePromise = null;
let _meAt = 0;

export async function fetchMe({ force = false } = {}) {
  if (!force && _mePromise && Date.now() - _meAt < ME_TTL) return _mePromise;
  if (!getToken()) {
    _mePromise = null;
    _meAt = 0;
    return null;
  }
  _meAt = Date.now();
  _mePromise = (async () => {
    try {
      const { user } = await request('/api/auth/me', { auth: true, silent: true });
      return user;
    } catch { return null; }
  })();
  return _mePromise;
}

export function invalidateMe() {
  _mePromise = null;
  _meAt = 0;
}

export async function logout() {
  try { await request('/api/auth/logout', { method: 'POST', auth: true, silent: true }); } catch {}
  clearToken();
  invalidateMe();
  location.href = '/login.html';
}

export function avatarUrl(avatar) {
  if (!avatar || avatar === 'COMMON:normal_avatar') return '/api/data/assets/COMMON:normal_avatar';
  return `/api/data/assets/${avatar}`;
}
