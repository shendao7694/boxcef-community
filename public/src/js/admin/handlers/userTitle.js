// @path: src/js/admin/handlers/userTitle.js
import { $, state, adminFetch } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { showToast } from '../utils/toast.js';

export async function openUserTitle(key) {
  const user = state.users.find(u => u.key === key);
  if (!user) {
    showToast('用户不存在', 'error');
    return;
  }

  let data;
  try {
    data = await adminFetch('/api/admin/title/list');
  } catch {
    return;
  }
  const allTitles = data.titles || {};

  let freshOwn = new Set(user.title?.own || []);
  try {
    const detail = await adminFetch(`/api/admin/user/detail?key=${encodeURIComponent(key)}`);
    if (detail.user && detail.user.title) {
      freshOwn = new Set(detail.user.title.own || []);
    }
  } catch {}

  $('user-title-key').value = key;
  $('user-title-name').textContent = user.nickname || user.name;

  const box = $('user-title-list');
  box.innerHTML = '';

  if (!Object.keys(allTitles).length) {
    box.innerHTML = '<div class="empty">还没有头衔，先到「头衔管理」创建</div>';
  } else {
    for (const [id, t] of Object.entries(allTitles)) {
      const checked = freshOwn.has(id);
      const bg = t.background || {};
      const style = bg.type === 'image'
        ? `background-image:url('/api/data/assets/${encodeURIComponent(bg.data)}');background-size:cover;background-position:center;color:#fff;`
        : `background:${bg.data || '#000'};color:#fff;`;
      const row = document.createElement('label');
      row.className = 'user-title-row';
      row.innerHTML = `
        <input type="checkbox" data-tid="${id}" data-initial="${checked ? '1' : '0'}" ${checked ? 'checked' : ''}>
        <span class="user-title" style="${style}">${escapeHtml(t.name)}</span>
        <span class="mono">#${id}</span>
      `;
      box.appendChild(row);
    }
  }

  $('user-title-modal').hidden = false;
}

export function bindUserTitle() {
  $('ut-cancel').addEventListener('click', () => {
    $('user-title-modal').hidden = true;
  });

  $('ut-save').addEventListener('click', async () => {
    const key = $('user-title-key').value;
    if (!key) return;

    const boxes = $('user-title-list').querySelectorAll('input[data-tid]');
    const tasks = [];
    for (const cb of boxes) {
      const id = cb.dataset.tid;
      const had = cb.dataset.initial === '1';
      const has = cb.checked;
      if (has && !had) {
        tasks.push(adminFetch('/api/admin/user/title', {
          method: 'POST',
          body: { key, titleId: id, action: 'add' }
        }));
      } else if (!has && had) {
        tasks.push(adminFetch('/api/admin/user/title', {
          method: 'POST',
          body: { key, titleId: id, action: 'remove' }
        }));
      }
    }

    if (!tasks.length) {
      showToast('没有变化');
      $('user-title-modal').hidden = true;
      return;
    }

    const btn = $('ut-save');
    btn.disabled = true;
    btn.textContent = '保存中...';
    try {
      await Promise.all(tasks);
      showToast('已保存');
      $('user-title-modal').hidden = true;
      await window.__reloadAll();
    } catch {}
    btn.disabled = false;
    btn.textContent = '保存';
  });
}