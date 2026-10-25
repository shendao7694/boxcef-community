// @path: src/js/admin/renders/advice.js
import { $, state } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, avatarImg } from '../utils/format.js';

const STATUS_LABELS = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝'
};

export function renderAdvice() {
  const filter = ($('advice-filter')?.value || '');
  const rows = filter
    ? state.advice.filter(a => a.status === filter)
    : state.advice;

  $('advice-count').textContent = rows.length;
  const tbody = $('advice-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">暂无建议</td></tr>';
    return;
  }

  for (const a of rows) {
    const u = a.author;
    const author = u
      ? `<span class="cmt-author">${avatarImg(u.avatar)}${escapeHtml(u.nickname || u.name || '未知')}</span>`
      : '<span style="color:var(--text-soft)">未知</span>';
    const canReply = a.status === 'accepted' || a.status === 'rejected';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${a.idx}</td>
      <td>${author}</td>
      <td class="cmt-content">${escapeHtml(a.content)}</td>
      <td><span class="advice-badge status-${a.status}">${STATUS_LABELS[a.status] || a.status}</span></td>
      <td>${fmtTime(a.createdAt)}</td>
      <td class="row-actions">
        <button data-adv="${a.idx}" data-act="accept">接受</button>
        <button data-adv="${a.idx}" data-act="reject">拒绝</button>
        <button data-adv="${a.idx}" data-act="pending">重置</button>
        <button data-adv-reply="${a.idx}" ${canReply ? '' : 'disabled'}>回复</button>
        <button class="danger" data-adv="${a.idx}" data-act="delete">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}