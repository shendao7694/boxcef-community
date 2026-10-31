// @path: src/js/admin/state.js
import { showToast } from '../common/toast.js';

export const $ = (id) => document.getElementById(id);

export let adminToken = localStorage.getItem('adminToken') || '';
export let state = {
  users: [],
  tokens: [],
  assets: [],
  settings: {},
  verifications: [],
  advice: []
};
export let postsCache = [];
export let editingKey = null;
export let editingVerifyKey = null;
export let currentView = 'posts';

export function setAdminToken(t) { adminToken = t; }
export function setState(s) { state = s; }
export function setPostsCache(p) { postsCache = p; }
export function setEditingKey(k) { editingKey = k; }
export function setEditingVerifyKey(k) { editingVerifyKey = k; }
export function setCurrentView(v) { currentView = v; }

export function adminFetch(path, { method = 'GET', body, isForm = false, silent = false } = {}) {
  const headers = { Authorization: `Bearer ${adminToken}` };
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  return fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : (isForm ? body : JSON.stringify(body))
  }).then(async (res) => {
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (!silent) showToast(data.error || '请求失败', 'error');
      throw new Error(data.error || 'fail');
    }
    return data;
  }).catch((err) => {
    if (err.message === 'fail' || err.message === 'network') throw err;
    if (!silent) showToast('网络错误', 'error');
    throw err;
  });
}