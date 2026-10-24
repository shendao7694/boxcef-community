// @path: src/js/admin/handlers/settings.js
import { $, state, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';

export function bindSettings() {
  $('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    
    const body = {
      tokenValidTime: Number($('tokenValidTime').value) || 720,
      registerNeedEmailVerity: $('registerNeedEmailVerity').checked,
      maxUploadSize: Number($('maxUploadSize').value) || 100,
      buildUserIdxTime: Number($('buildUserIdxTime').value) || 168,
      maxImageInDisc: Number($('maxImageInDisc').value) || 20,
      publishPostMax: Number($('publishPostMax').value) || 20,
      publishBoxPlayMax: Number($('publishBoxPlayMax').value) || 1,
      publishPostCooling: Number($('publishPostCooling').value) || 60,
      publishBoxPlayCooling: Number($('publishBoxPlayCooling').value) || 300,
      boxPlayStatus: $('boxPlayStatus').checked,
      boxPlayVaildText: $('boxPlayVaildText').value.trim() || 'BoxPlay 服务暂时关闭'
    };

    const btn = $('save-settings-btn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      const { settings } = await adminFetch('/api/admin/settings', { method: 'POST', body });
      state.settings = settings;
      showToast('设置已保存');
    } catch {}
    
    btn.disabled = false;
    btn.textContent = '保存设置';
  });
}