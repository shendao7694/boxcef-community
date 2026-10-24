// @path: src/js/admin/handlers/assets.js
import { $, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';

export async function deleteAsset(key) {
  if (!confirm(`确认删除资源 ${key}？`)) return;
  try {
    await adminFetch('/api/admin/asset/delete', { method: 'POST', body: { key } });
    showToast('已删除');
    await window.__reloadAll();
  } catch {}
}

export function bindAssets() {
  $('upload-asset-btn').addEventListener('click', () => $('asset-input').click());
  $('asset-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('文件不能超过 5MB', 'error');
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    const btn = $('upload-asset-btn');
    btn.disabled = true;
    btn.textContent = '上传中...';
    try {
      const { key } = await adminFetch('/api/admin/asset/upload', { method: 'POST', isForm: true, body: fd });
      showToast(`已上传：${key.slice(0, 12)}...`);
      await window.__reloadAll();
    } catch {}
    btn.disabled = false;
    btn.textContent = '上传文件';
    e.target.value = '';
  });

  $('assets-table').querySelector('tbody').addEventListener('click', (e) => {
    const del = e.target.closest('button[data-del-asset]');
    if (del && !del.disabled) deleteAsset(del.dataset.delAsset);
  });
}