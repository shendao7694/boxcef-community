// @path: src/js/admin/main.js
import {
  $, adminToken, setAdminToken, adminFetch
} from './state.js';
import {
  bindNav, bindUsers, bindDisc, bindUserTitle, bindAssets,
  bindVerifications, bindPosts, bindComments, bindAdvice,
  bindSettings, bindDanger, bindUserIdxRebuild, bindAds, bindTitles,
  loadComments, loadPosts,
  openEdit, deleteUser, openUserTitle, openUserDisc
} from './handlers/main.js';
import { switchView, reloadView, invalidateAll } from './handlers/nav.js';
import { showToast } from './utils/toast.js';
import { bindBoxplay } from './handlers/boxplay.js';
import { bindTagDict } from './handlers/tags.js';

window.__reloadAll = () => reloadView();
window.__invalidateAll = invalidateAll;
window.__loadPosts = loadPosts;
window.__gotoComments = gotoComments;

async function gotoComments(pid) {
  await switchView('comments');
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
      await adminFetch(url, { method: 'POST', body });
      showToast('已回复');
      $('reply-modal').hidden = true;
    } catch {}
    btn.disabled = false;
    btn.textContent = '发送';
  });
}

async function verifyToken() {
  await adminFetch('/api/admin/auth', { silent: true });
}

function enterPanel() {
  showPanel();
  switchView('posts');
}

async function initAdmin() {
  bindBoxplay();
  bindTagDict();
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
    if (edit) openEdit(edit.dataset.edit);
    if (del) deleteUser(del.dataset.del);
    if (t) openUserTitle(t.dataset.title);
    if (disc) openUserDisc(disc.dataset.disc);
  });

  $('admin-login-btn').addEventListener('click', async () => {
    const t = $('admin-token').value.trim();
    if (!t) { showToast('请输入 token', 'error'); return; }
    setAdminToken(t);
    try {
      await verifyToken();
      localStorage.setItem('adminToken', t);
      enterPanel();
      showToast('已进入管理面板');
    } catch {
      setAdminToken('');
      showToast('Token 无效', 'error');
    }
  });

  $('logout-btn').addEventListener('click', () => {
    setAdminToken('');
    localStorage.removeItem('adminToken');
    invalidateAll();
    showLogin();
    $('admin-token').value = '';
  });

  $('refresh-btn').addEventListener('click', async () => {
    try {
      await reloadView();
      showToast('已刷新');
    } catch {}
  });

  if (adminToken) {
    try {
      await verifyToken();
      enterPanel();
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
