// @path: src/js/admin/handlers/danger.js
import { $, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';

export function bindDanger() {
  $('reset-btn').addEventListener('click', async () => {
    if (!confirm('重置 globalSettings 与默认头像（保留用户）？')) return;
    try {
      await adminFetch('/api/admin/kv/reset', { method: 'POST', body: {} });
      showToast('已重置');
      window.__invalidateAll?.();
      await window.__reloadAll();
    } catch {}
  });

  $('purge-btn').addEventListener('click', async () => {
    if (!confirm('确认清空所有用户数据？此操作不可恢复！')) return;
    try {
      await adminFetch('/api/admin/kv/reset', { method: 'POST', body: { purge: true } });
      showToast('已清空');
      window.__invalidateAll?.();
      await window.__reloadAll();
    } catch {}
  });
}

export function bindUserIdxRebuild() {
  const btn = $('rebuild-idx-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!confirm('确认重新构建用户索引？')) return;
    btn.disabled = true;
    btn.textContent = '构建中...';
    try {
      const data = await adminFetch('/api/admin/user/index-rebuild', { method: 'POST', body: {} });
      showToast(`已重建：name ${data.nameCount} / nickname ${data.nicknameCount}`);
    } catch {}
    btn.disabled = false;
    btn.textContent = '重建用户索引';
  });

  const postBtn = $('rebuild-postidx-btn');
  if (!postBtn) return;
  postBtn.addEventListener('click', async () => {
    if (!confirm('确认重建帖子/作品分类索引？旧作品将自动归入「其他」')) return;
    postBtn.disabled = true;
    postBtn.textContent = '构建中...';
    try {
      const data = await adminFetch('/api/admin/idx/rebuild', { method: 'POST', body: {} });
      const extra = data.boxplayFixed ? `，${data.boxplayFixed} 个旧作品已归入其他` : '';
      showToast(`已重建：帖子 ${data.postCount} / 作品 ${data.boxplayCount}${extra}`);
    } catch {}
    postBtn.disabled = false;
    postBtn.textContent = '重建帖子/作品索引';
  });
}