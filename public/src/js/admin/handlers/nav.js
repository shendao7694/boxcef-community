// @path: src/js/admin/handlers/nav.js
import { $, currentView, setCurrentView } from '../state.js';
import { loadPosts } from './posts.js';
import { loadComments } from './comments.js';
import { loadUsers } from './users.js';
import { loadAssets } from './assets.js';
import { loadVerifications } from './verifications.js';
import { loadAdvice } from './advice.js';
import { loadSettings } from './settings.js';
import { loadAds } from './ads.js';
import { loadTitles } from './titles.js';
import { loadBoxplayList } from './boxplay.js';
import { loadTagDict } from './tags.js';

const loaders = {
  posts: loadPosts,
  boxplay: loadBoxplayList,
  tags: loadTagDict,
  ads: loadAds,
  titles: loadTitles,
  users: loadUsers,
  verifications: loadVerifications,
  advice: loadAdvice,
  assets: loadAssets,
  settings: loadSettings
};

const loaded = new Set();
const inflight = new Map();

function runView(view, force = false) {
  const loader = loaders[view];
  if (!loader) return Promise.resolve();
  if (!force && loaded.has(view)) return Promise.resolve();
  if (inflight.has(view)) return inflight.get(view);

  const task = Promise.resolve()
    .then(loader)
    .then(() => { loaded.add(view); })
    .catch((err) => { console.error(`[admin] load ${view} failed`, err); })
    .finally(() => { inflight.delete(view); });

  inflight.set(view, task);
  return task;
}

function loadView(view, force = false) {
  if (view === 'comments') {
    return runView('posts').then(() => {
      const pid = $('comment-post-select').value;
      return loadComments(pid);
    });
  }
  return runView(view, force);
}

export function invalidateAll() {
  loaded.clear();
}

export function reloadView(view = currentView) {
  if (view === 'comments') loaded.delete('posts');
  else loaded.delete(view);
  return loadView(view, true);
}

export function switchView(view, { force = false } = {}) {
  setCurrentView(view);
  document.querySelectorAll('.admin-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  document.querySelectorAll('.admin-main > [data-panel]').forEach(sec => {
    sec.classList.toggle('panel-active', sec.dataset.panel === view);
  });
  return loadView(view, force);
}

export function bindNav() {
  document.querySelectorAll('.admin-nav-item').forEach(b => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });
  document.querySelectorAll('.admin-group-head').forEach(h => {
    h.addEventListener('click', () => h.closest('.admin-group').classList.toggle('collapsed'));
  });
}
