// @path: src/js/admin/handlers/titles.js
import { $, adminFetch } from '../state.js';
import { renderTitles, getTitlesCache, setTitlesCache } from '../renders/titles.js';
import { showToast } from '../utils/toast.js';

export async function loadTitles() {
  try {
    const data = await adminFetch('/api/admin/title/list');
    setTitlesCache(data.titles || {});
  } catch {
    setTitlesCache({});
  }
  renderTitles();
}

function openTitleEdit(id) {
  const t = id ? getTitlesCache()[id] : null;
  $('t-id').value = id || '';
  $('t-name').value = t?.name || '';
  $('t-bg-type').value = t?.background?.type || 'color';
  $('t-bg-data').value = t?.background?.data || '#000000';
  $('title-modal-title').textContent = id ? '编辑头衔' : '新建头衔';
  $('title-modal').hidden = false;
}

async function deleteTitle(id) {
  if (!confirm('确认删除该头衔？')) return;
  try {
    await adminFetch('/api/admin/title/update', {
      method: 'POST',
      body: { id, action: 'delete' }
    });
    showToast('已删除');
    await loadTitles();
  } catch {}
}

export function bindTitles() {
  $('title-add-btn').addEventListener('click', () => openTitleEdit(''));
  $('t-cancel').addEventListener('click', () => { $('title-modal').hidden = true; });

  $('title-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('t-id').value;
    const payload = {
      name: $('t-name').value.trim(),
      background: {
        type: $('t-bg-type').value,
        data: $('t-bg-data').value.trim()
      }
    };
    if (id) payload.id = id;
    const url = id ? '/api/admin/title/update' : '/api/admin/title/create';
    try {
      await adminFetch(url, { method: 'POST', body: payload });
      showToast('已保存');
      $('title-modal').hidden = true;
      await loadTitles();
    } catch {}
  });

  $('title-list').addEventListener('click', (e) => {
    const edit = e.target.closest('button[data-title-edit]');
    const del = e.target.closest('button[data-title-del]');
    if (edit) openTitleEdit(edit.dataset.titleEdit);
    if (del) deleteTitle(del.dataset.titleDel);
  });
}