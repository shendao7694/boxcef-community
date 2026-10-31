// @path: src/js/common/api.js
import { showToast } from './toast.js';

const inflight = new Map();

export function getToken() { return localStorage.getItem('token') || ''; }
export function setToken(t) { localStorage.setItem('token', t); }
export function clearToken() { localStorage.removeItem('token'); }

export async function request(path, { method = 'GET', body, auth = false, isForm = false, timeout, signal, dedupe = true, silent = false } = {}) {
  const isGet = method === 'GET';
  const key = isGet && dedupe ? `${auth ? getToken() : ''}|${path}` : null;
  if (key) {
    const hit = inflight.get(key);
    if (hit) return hit;
  }

  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const run = (async () => {
    const controller = new AbortController();
    const limit = timeout ?? (isForm ? 60000 : 15000);
    const timer = setTimeout(() => controller.abort(), limit);
    const onAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }

    let response;
    try {
      response = await fetch(path, {
        method,
        headers,
        credentials: 'include',
        signal: controller.signal,
        body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body))
      });
    } catch (err) {
      if (signal?.aborted) throw err;
      if (!silent) {
        showToast(err.name === 'AbortError' ? '请求超时，请稍后重试' : '网络错误，请稍后重试', 'error');
      }
      throw new Error(err.name === 'AbortError' ? 'timeout' : 'network');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', onAbort);
    }

    const text = await response.text();
    let data = {};
    if (text) {
      try { data = JSON.parse(text); } catch { data = {}; }
    }

    if (!response.ok) {
      const msg = data.error || '请求失败';
      if (!silent) showToast(msg, 'error');
      if (response.status === 401 && auth) {
        clearToken();
        setTimeout(() => { location.href = '/login.html'; }, 800);
      }
      throw new Error(msg);
    }
    return data;
  })();

  if (key) {
    inflight.set(key, run);
    const cleanup = () => {
      if (inflight.get(key) === run) inflight.delete(key);
    };
    run.then(cleanup, cleanup);
  }
  return run;
}
