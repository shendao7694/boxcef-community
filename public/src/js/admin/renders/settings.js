// @path: src/js/admin/renders/settings.js
import { $, state } from '../state.js';

export function renderSettings() {
  $('tokenValidTime').value = state.settings.tokenValidTime ?? 720;
  $('registerNeedEmailVerity').checked = state.settings.registerNeedEmailVerity === true || state.settings.registerNeedEmailVerity === 'true';
  
  if ($('maxUploadSize')) {
    $('maxUploadSize').value = state.settings.maxUploadSize ?? 100;
  }
  if ($('buildUserIdxTime')) {
    $('buildUserIdxTime').value = state.settings.buildUserIdxTime ?? 168;
  }
  if ($('maxImageInDisc')) {
    $('maxImageInDisc').value = state.settings.maxImageInDisc ?? 20;
  }
  
  if ($('publishPostMax')) {
    $('publishPostMax').value = state.settings.publishPostMax ?? 20;
  }
  if ($('publishBoxPlayMax')) {
    $('publishBoxPlayMax').value = state.settings.publishBoxPlayMax ?? 1;
  }
  if ($('publishPostCooling')) {
    $('publishPostCooling').value = state.settings.publishPostCooling ?? 60;
  }
  if ($('publishBoxPlayCooling')) {
    $('publishBoxPlayCooling').value = state.settings.publishBoxPlayCooling ?? 300;
  }
  
  if ($('boxPlayStatus')) {
    $('boxPlayStatus').checked = state.settings.boxPlayStatus !== false;
  }
  if ($('boxPlayVaildText')) {
    $('boxPlayVaildText').value = state.settings.boxPlayVaildText ?? 'BoxPlay 服务暂时关闭';
  }
}