// @path: src/js/admin/renders/verifications.js
import { $, state } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime } from '../utils/format.js';

export function renderVerifications() {
  $('verification-count').textContent = state.verifications.length;
  const tbody = $('verifications-table').querySelector('tbody');
  tbody.innerHTML = '';
  if (!state.verifications.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">暂无验证码</td></tr>';
    return;
  }
  for (const v of state.verifications) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(v.key)}</td>
      <td>${escapeHtml(v.purpose || '')}</td>
      <td class="mono">${escapeHtml(v.code || '')}</td>
      <td>${fmtTime(v.expire)}</td>
      <td class="row-actions">
        <button data-edit-v="${escapeHtml(v.key)}">编辑</button>
        <button class="danger" data-del-v="${escapeHtml(v.key)}">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}