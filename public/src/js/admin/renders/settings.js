// @path: src/js/admin/renders/settings.js
import { $, state } from '../state.js';

export function renderSettings() {
  $('tokenValidTime').value = state.settings.tokenValidTime ?? 720;
  $('registerNeedEmailVerity').checked = !!state.settings.registerNeedEmailVerity;
  if ($('maxUploadSize')) {
    $('maxUploadSize').value = state.settings.maxUploadSize ?? 100;
  }
  if ($('buildUserIdxTime')) {
    $('buildUserIdxTime').value = state.settings.buildUserIdxTime ?? 168;
  }
  if ($('maxImageInDisc')) {
    $('maxImageInDisc').value = state.settings.maxImageInDisc ?? 20;
  }
}