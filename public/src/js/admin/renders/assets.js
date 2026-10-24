// @path: src/js/admin/renders/assets.js
import { $, state } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, fmtSize } from '../utils/format.js';

export function renderAssets() {
  $('asset-count').textContent = state.assets.length;
  const tbody = $('assets-table').querySelector('tbody');
  tbody.innerHTML = '';
  if (!state.assets.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">暂无资源</td></tr>';
    return;
  }
  for (const a of state.assets) {
    const isImage = a.type && a.type.startsWith('image/');
    const isText = a.type && a.type.startsWith('text/');
    const preview = isImage
      ? `<img class="asset-preview" src="/api/data/assets/${a.key}" alt="">`
      : (isText ? `<a href="/api/data/assets/${a.key}" target="_blank" rel="noopener">查看</a>` : '-');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(a.key)}</td>
      <td>${escapeHtml(a.type || '')}</td>
      <td>${fmtSize(a.size)}</td>
      <td>${fmtTime(a.date)}</td>
      <td>${preview}</td>
      <td class="row-actions">
        <button class="danger" data-del-asset="${escapeHtml(a.key)}" ${a.key === 'COMMON:normal_avatar' ? 'disabled' : ''}>删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}