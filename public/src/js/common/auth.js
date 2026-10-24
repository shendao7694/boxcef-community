// @path: src/js/common/auth.js
import { request, clearToken, getToken } from './api.js';

let _mePromise = null;

export async function fetchMe() {
  if (_mePromise) return _mePromise;
  if (!getToken()) return null;
  _mePromise = (async () => {
    try {
      const { user } = await request('/api/auth/me', { auth: true });
      return user;
    } catch { return null; }
  })();
  return _mePromise;
}

export async function logout() {
  try { await request('/api/auth/logout', { method: 'POST', auth: true }); } catch {}
  clearToken();
  location.href = '/login.html';
}

export function avatarUrl(avatar) {
  if (!avatar || avatar === 'COMMON:normal_avatar') return '/api/data/assets/COMMON:normal_avatar';
  return `/api/data/assets/${avatar}`;
}