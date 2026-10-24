// @path: src/js/common/api.js
import { showToast } from './toast.js';

export function getToken() { return localStorage.getItem('token') || ''; }
export function setToken(t) { localStorage.setItem('token', t); }
export function clearToken() { localStorage.removeItem('token'); }

export async function request(path, { method = 'GET', body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body))
    });
  } catch {
    showToast('网络错误，请稍后重试', 'error');
    throw new Error('network');
  }

  let data = {};
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    const msg = data.error || '请求失败';
    showToast(msg, 'error');
    if (response.status === 401 && auth) {
      clearToken();
      setTimeout(() => { location.href = '/login.html'; }, 800);
    }
    throw new Error(msg);
  }
  return data;
}