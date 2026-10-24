// @path: src/js/admin/handlers/settings.js
import { $, state, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';

export function bindSettings() {
  $('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      tokenValidTime: Number($('tokenValidTime').value) || 720,
      registerNeedEmailVerity: $('registerNeedEmailVerity').checked
    };
    if ($('maxUploadSize')) {
      body.maxUploadSize = Number($('maxUploadSize').value) || 100;
    }
    if ($('buildUserIdxTime')) {
      body.buildUserIdxTime = Number($('buildUserIdxTime').value) || 168;
    }
    if ($('maxImageInDisc')) {
      body.maxImageInDisc = Number($('maxImageInDisc').value) || 20;
    }
    try {
      const { settings } = await adminFetch('/api/admin/settings', { method: 'POST', body });
      state.settings = settings;
      showToast('设置已保存');
    } catch {}
  });
}