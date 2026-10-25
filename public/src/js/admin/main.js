// @path: src/js/admin/main.js
import {
  $, adminToken, setAdminToken, setState, setPostsCache, state
} from './state.js';
import {
  renderUsers, renderAssets, renderVerifications, renderSettings,
  renderPosts, renderAdvice
} from './renders/main.js';
import {
  bindNav, bindUsers, bindDisc, bindUserTitle, bindAssets,
  bindVerifications, bindPosts, bindComments, bindAdvice,
  bindSettings, bindDanger, bindUserIdxRebuild, bindAds, bindTitles,
  loadAds, loadTitles, loadComments, fillCommentPostSelect
} from './handlers/main.js';
import { switchView } from './handlers/nav.js';
import { showToast } from './utils/toast.js';
import { loadBoxplayList, bindBoxplay } from './handlers/boxplay.js';

window.__reloadAll = loadAll;
window.__loadPosts = loadPosts;
window.__gotoComments = gotoComments;

async function loadPosts() {
  try {
    const data = await window.__adminFetch('/api/admin/post/list');
    setPostsCache(data.posts || []);
  } catch {
    setPostsCache([]);
  }
  renderPosts();
  fillCommentPostSelect();
}

async function loadAll() {
  const data = await window.__adminFetch('/api/admin/dashboard');
  setState({
    users: data.users || [],
    tokens: data.tokens || [],
    assets: data.assets || [],
    settings: data.settings || {},
    verifications: data.verifications || [],
    advice: []
  });
  await renderUsers();
  renderAssets();
  renderVerifications();
  renderSettings();
  await loadPosts();
  await loadAds();
  await loadTitles();
  await loadBoxplayList();

  const adviceData = await window.__adminFetch('/api/admin/advice/list');
  setState({ ...state, advice: adviceData.advice || [] });
  renderAdvice();
}

function gotoComments(pid) {
  switchView('comments');
  const sel = $('comment-post-select');
  if (sel) sel.value = pid;
  loadComments(pid);
}

function bindReplyModal() {
  const cancel = $('reply-cancel');
  if (cancel) {
    cancel.addEventListener('click', () => { $('reply-modal').hidden = true; });
  }

  const form = $('reply-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = $('reply-target-type').value;
    const id = $('reply-target-id').value;
    const text = $('reply-text').value.trim();
    if (!text) { showToast('回复内容不能为空', 'error'); return; }

    const url = type === 'boxplay' ? '/api/admin/boxplay/reply' : '/api/admin/advice/reply';
    const body = type === 'boxplay' ? { id, text } : { index: Number(id), text };

    const btn = $('reply-save');
    btn.disabled = true;
    btn.textContent = '发送中...';
    try {
      await window.__adminFetch(url, { method: 'POST', body });
      showToast('已回复');
      $('reply-modal').hidden = true;
    } catch {}
    btn.disabled = false;
    btn.textContent = '发送';
  });
}

async function initAdmin() {
  const { adminFetch } = await import('./state.js');
  window.__adminFetch = adminFetch;
  bindBoxplay();
  bindNav();
  bindUsers();
  bindDisc();
  bindUserTitle();
  bindAssets();
  bindVerifications();
  bindPosts();
  bindComments();
  bindAdvice();
  bindSettings();
  bindDanger();
  bindUserIdxRebuild();
  bindAds();
  bindTitles();
  bindReplyModal();

  $('users-table').querySelector('tbody').addEventListener('click', async (e) => {
    const edit = e.target.closest('button[data-edit]');
    const del = e.target.closest('button[data-del]');
    const t = e.target.closest('button[data-title]');
    const disc = e.target.closest('button[data-disc]');
    if (edit) (await import('./handlers/users.js')).openEdit(edit.dataset.edit);
    if (del) (await import('./handlers/users.js')).deleteUser(del.dataset.del);
    if (t) (await import('./handlers/userTitle.js')).openUserTitle(t.dataset.title);
    if (disc) (await import('./handlers/disc.js')).openUserDisc(disc.dataset.disc);
  });

  $('admin-login-btn').addEventListener('click', async () => {
    const t = $('admin-token').value.trim();
    if (!t) { showToast('请输入 token', 'error'); return; }
    setAdminToken(t);
    try {
      await loadAll();
      localStorage.setItem('adminToken', t);
      showPanel();
      switchView('posts');
      showToast('已进入管理面板');
    } catch (err) {
      console.error('[login]', err);
      setAdminToken('');
    }
  });

  $('logout-btn').addEventListener('click', () => {
    setAdminToken('');
    localStorage.removeItem('adminToken');
    showLogin();
    $('admin-token').value = '';
  });

  $('refresh-btn').addEventListener('click', async () => {
    try {
      await loadAll();
      showToast('已刷新');
    } catch {}
  });

  if (adminToken) {
    try {
      await loadAll();
      showPanel();
      switchView('posts');
      return;
    } catch {
      setAdminToken('');
      localStorage.removeItem('adminToken');
    }
  }
  showLogin();
}

function showPanel() {
  $('login-view').hidden = true;
  $('panel-view').hidden = false;
  $('logout-btn').hidden = false;
  $('refresh-btn').hidden = false;
}

function showLogin() {
  $('login-view').hidden = false;
  $('panel-view').hidden = true;
  $('logout-btn').hidden = true;
  $('refresh-btn').hidden = true;
}

initAdmin();