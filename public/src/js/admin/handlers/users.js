// @path: src/js/admin/handlers/users.js
import {
  $, state, adminFetch, editingKey, setEditingKey, setState
} from '../state.js';
import { renderUsers } from '../renders/users.js';
import { showToast } from '../utils/toast.js';
import { confirm } from '../../common/dialog.js';
import { t } from '../../common/i18n.js';

let page = 1;
let pageSize = 10;
let query = '';
let total = 0;
let searchTimer = null;

function updatePager() {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  $('user-page-info').textContent = `${page} / ${pages}`;
  $('user-page-prev').disabled = page <= 1;
  $('user-page-next').disabled = page >= pages;
}

export async function loadUsers(reset = false) {
  if (reset) page = 1;
  try {
    const url = `/api/admin/dashboard?section=users&page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(query)}`;
    const data = await adminFetch(url);
    setState({ ...state, users: data.users || [] });
    total = Number(data.total) || (data.users || []).length;
  } catch {
    setState({ ...state, users: [] });
    total = 0;
  }
  await renderUsers(total);
  updatePager();
}

export function openEdit(key) {
  const u = state.users.find(x => x.key === key);
  if (!u) return;
  setEditingKey(key);

  $('e-name').value = u.name || '';
  $('e-nickname').value = u.nickname || '';
  $('e-email').value = u.email || '';
  $('e-group').value = u.group || 'user';
  $('e-description').value = u.description || '';
  $('e-avatar').value = u.avatar || 'COMMON:normal_avatar';

  $('e-max-upload').value = u.limit?.maxUploadSize ?? '';
  $('e-max-image').value = u.limit?.maxImageInDisc ?? '';
  $('e-publish-post-max').value = u.limit?.publishPostMax ?? '';
  $('e-publish-box-max').value = u.limit?.publishBoxPlayMax ?? '';
  $('e-publish-post-cool').value = u.limit?.publishPostCooling ?? '';
  $('e-publish-box-cool').value = u.limit?.publishBoxPlayCooling ?? '';

  $('e-password').value = '';
  $('edit-modal').hidden = false;
}

export async function deleteUser(key) {
  const ok = await confirm(t('确认删除该用户？该操作不可恢复'), { danger: true });
  if (!ok) return;
  try {
    await adminFetch('/api/admin/user', { method: 'POST', body: { key } });
    showToast(t('已删除'));
    await loadUsers(false);
    if (!state.users.length && page > 1) {
      page -= 1;
      await loadUsers(false);
    }
  } catch {}
}

async function toggleBan(key, banned) {
  const message = banned ? t('确定要解封该用户吗？') : t('确定要封禁该用户吗？');
  const ok = await confirm(message, { danger: !banned });
  if (!ok) return;
  try {
    await adminFetch('/api/admin/user/update', {
      method: 'POST',
      body: { key, patch: { isban: !banned } }
    });
    showToast(banned ? t('已解封') : t('已封禁'));
    await loadUsers(false);
  } catch {}
}

export function bindUsers() {
  const search = $('user-search');
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        query = search.value.trim();
        loadUsers(true);
      }, 300);
    });
  }

  $('user-page-size').addEventListener('change', () => {
    pageSize = Number($('user-page-size').value) || 10;
    loadUsers(true);
  });
  $('user-page-prev').addEventListener('click', () => {
    if (page <= 1) return;
    page -= 1;
    loadUsers(false);
  });
  $('user-page-next').addEventListener('click', () => {
    page += 1;
    loadUsers(false);
  });

  $('e-cancel').addEventListener('click', () => {
    $('edit-modal').hidden = true;
    setEditingKey(null);
  });

  $('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    const patch = {
      name: $('e-name').value.trim(),
      nickname: $('e-nickname').value.trim(),
      email: $('e-email').value.trim(),
      group: $('e-group').value.trim(),
      description: $('e-description').value,
      avatar: $('e-avatar').value.trim()
    };

    patch.limit = {};
    const up = $('e-max-upload').value.trim();
    const img = $('e-max-image').value.trim();
    const pMax = $('e-publish-post-max').value.trim();
    const bMax = $('e-publish-box-max').value.trim();
    const pCool = $('e-publish-post-cool').value.trim();
    const bCool = $('e-publish-box-cool').value.trim();

    if (up) patch.limit.maxUploadSize = Number(up);
    if (img) patch.limit.maxImageInDisc = Number(img);
    if (pMax) patch.limit.publishPostMax = Number(pMax);
    if (bMax) patch.limit.publishBoxPlayMax = Number(bMax);
    if (pCool) patch.limit.publishPostCooling = Number(pCool);
    if (bCool) patch.limit.publishBoxPlayCooling = Number(bCool);

    const pwd = $('e-password').value;
    if (pwd) patch.password = pwd;

    const btn = $('e-save');
    btn.disabled = true;
    btn.textContent = t('保存中...');
    try {
      await adminFetch('/api/admin/user/update', { method: 'POST', body: { key: editingKey, patch } });
      showToast(t('已保存'));
      $('edit-modal').hidden = true;
      setEditingKey(null);
      await loadUsers(false);
    } catch {}
    btn.disabled = false;
    btn.textContent = t('保存');
  });

  $('add-user-btn').addEventListener('click', () => {
    $('c-name').value = '';
    $('c-nickname').value = '';
    $('c-email').value = '';
    $('c-password').value = '';
    $('c-group').value = 'user';
    $('c-description').value = '';
    $('c-avatar').value = '';

    $('c-max-upload').value = '';
    $('c-max-image').value = '';
    $('c-publish-post-max').value = '';
    $('c-publish-box-max').value = '';
    $('c-publish-post-cool').value = '';
    $('c-publish-box-cool').value = '';

    $('create-modal').hidden = false;
  });

  $('c-cancel').addEventListener('click', () => {
    $('create-modal').hidden = true;
  });

  $('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: $('c-name').value.trim(),
      nickname: $('c-nickname').value.trim(),
      email: $('c-email').value.trim(),
      password: $('c-password').value,
      group: $('c-group').value.trim(),
      description: $('c-description').value,
      avatar: $('c-avatar').value.trim()
    };

    payload.limit = {};
    const up = $('c-max-upload').value.trim();
    const img = $('c-max-image').value.trim();
    const pMax = $('c-publish-post-max').value.trim();
    const bMax = $('c-publish-box-max').value.trim();
    const pCool = $('c-publish-post-cool').value.trim();
    const bCool = $('c-publish-box-cool').value.trim();

    if (up) payload.limit.maxUploadSize = Number(up);
    if (img) payload.limit.maxImageInDisc = Number(img);
    if (pMax) payload.limit.publishPostMax = Number(pMax);
    if (bMax) payload.limit.publishBoxPlayMax = Number(bMax);
    if (pCool) payload.limit.publishPostCooling = Number(pCool);
    if (bCool) payload.limit.publishBoxPlayCooling = Number(bCool);

    if (!payload.name || !payload.email || !payload.password) {
      showToast(t('请填写 name、email、password'), 'error');
      return;
    }
    if (payload.password.length < 6) {
      showToast(t('密码至少 6 位'), 'error');
      return;
    }
    const btn = $('c-save');
    btn.disabled = true;
    btn.textContent = t('创建中...');
    try {
      await adminFetch('/api/admin/user/create', { method: 'POST', body: payload });
      showToast(t('用户已创建'));
      $('create-modal').hidden = true;
      await loadUsers(true);
    } catch {}
    btn.disabled = false;
    btn.textContent = t('创建');
  });
}

export { toggleBan };
