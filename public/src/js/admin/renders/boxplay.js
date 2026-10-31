// @path: src/js/admin/renders/boxplay.js
import { $ } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { avatarImg } from '../utils/format.js';

export function renderBoxplayList(items) {
  $('boxplay-count').textContent = items.length;
  const tbody = $('boxplay-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">暂无作品</td></tr>';
    return;
  }

  for (const b of items) {
    const w = b.writerInfo;
    const author = w
      ? `<span class="cmt-author">${avatarImg(w.avatar)}${escapeHtml(w.nickname || w.name)}</span>`
      : '未知';

    let statusText = '待审核', statusCls = 'status-pending';
    if (b.status === 'approved') { statusText = '已通过'; statusCls = 'status-accepted'; }
    if (b.status === 'rejected') { statusText = '已拒绝'; statusCls = 'status-rejected'; }

    const typeHtml = `<span class="bp-type-badge">${escapeHtml(b.type || '其他')}</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img loading="lazy" decoding="async" src="/api/data/assets/${encodeURIComponent(b.cover)}" style="width:60px;height:45px;object-fit:cover;border-radius:4px;"></td>
      <td>${escapeHtml(b.title)}</td>
      <td>${typeHtml}</td>
      <td>${author}</td>
      <td><a href="${escapeHtml(b.playurl)}" target="_blank" style="color:var(--accent);text-decoration:underline;">前往游玩</a></td>
      <td><span class="advice-badge ${statusCls}">${statusText}</span></td>
      <td class="row-actions">
        <button data-bp-type="${b.id}">分类</button>
        <button data-bp-id="${b.id}" data-bp-act="approve" ${b.status === 'approved' ? 'disabled' : ''}>通过</button>
        <button data-bp-id="${b.id}" data-bp-act="reject" ${b.status === 'rejected' ? 'disabled' : ''}>拒绝</button>
        <button data-bp-reply="${b.id}" ${b.status === 'pending' ? 'disabled' : ''}>回复</button>
        <button class="danger" data-bp-id="${b.id}" data-bp-act="delete">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
