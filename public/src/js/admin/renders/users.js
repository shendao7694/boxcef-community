// @path: src/js/admin/renders/users.js
import { $, state } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, avatarImg, limitText } from '../utils/format.js';
import { getTitles, renderTitleTag } from '../../common/title.js';

export async function renderUsers() {
  $('user-count').textContent = state.users.length;
  const tbody = $('users-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!state.users.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty">暂无用户</td></tr>';
    return;
  }

  const ids = state.users.map(u => u.title?.choose).filter(Boolean);
  const titles = ids.length ? await getTitles(ids) : {};

  for (const u of state.users) {
    const tag = renderTitleTag(u.title, titles);
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
      <td class="row-actions">
        <button data-edit="${u.key}">编辑</button>
        <button data-title="${u.key}">头衔</button>
        <button data-disc="${u.key}">图盘</button>
        <button class="danger" data-del="${u.key}">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}