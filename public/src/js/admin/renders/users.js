// @path: src/js/admin/renders/users.js
import { $, state } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, avatarImg, limitText } from '../utils/format.js';
import { getTitles, renderTitleTag } from '../../common/title.js';
import { t } from '../../common/i18n.js';

export async function renderUsers(total = state.users.length) {
  $('user-count').textContent = total;
  const tbody = $('users-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!state.users.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty">${t('暂无用户')}</td></tr>`;
    return;
  }

  const ids = state.users.map(u => u.title?.choose).filter(Boolean);
  const titles = ids.length ? await getTitles(ids) : {};

  for (const u of state.users) {
    const tag = renderTitleTag(u.title, titles);
    const banned = !!u.isban;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="avatar-cell">${avatarImg(u.avatar)}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.nickname || '')}${tag}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.group || '')}</td>
      <td class="mono">${escapeHtml(limitText(u.limit))}</td>
      <td>${fmtTime(u.lastLoginTime)}</td>
      <td class="mono">${escapeHtml(u.lastLoginIp || '')}</td>
      <td><span class="advice-badge ${banned ? 'status-rejected' : 'status-accepted'}">${banned ? t('已封禁') : t('正常')}</span></td>
      <td class="row-actions">
        <button data-edit="${u.key}">${t('编辑')}</button>
        <button data-title="${u.key}">${t('头衔')}</button>
        <button data-disc="${u.key}">${t('图盘')}</button>
        <button data-ban="${u.key}" data-banned="${banned ? '1' : '0'}" class="${banned ? '' : 'danger'}">${banned ? t('解封') : t('封禁')}</button>
        <button class="danger" data-del="${u.key}">${t('删除')}</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
