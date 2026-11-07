// @path: src/js/admin/renders/advice.js
import { $, state } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, avatarImg } from '../utils/format.js';
import { t } from '../../common/i18n.js';

const STATUS_LABELS = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝'
};

export function renderAdvice(total = state.advice.length) {
  const rows = state.advice;

  $('advice-count').textContent = total;
  const tbody = $('advice-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">${t('暂无建议')}</td></tr>`;
    return;
  }

  for (const a of rows) {
    const u = a.author;
    const author = u
      ? `<span class="cmt-author">${avatarImg(u.avatar)}${escapeHtml(u.nickname || u.name || t('未知'))}</span>`
      : `<span style="color:var(--text-soft)">${t('未知')}</span>`;
    const canReply = a.status === 'accepted' || a.status === 'rejected';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${a.idx}</td>
      <td>${author}</td>
      <td class="cmt-content">${escapeHtml(a.content)}</td>
      <td><span class="advice-badge status-${a.status}">${t(STATUS_LABELS[a.status] || a.status)}</span></td>
      <td>${fmtTime(a.createdAt)}</td>
      <td class="row-actions">
        <button data-adv="${a.idx}" data-act="accept">${t('接受')}</button>
        <button data-adv="${a.idx}" data-act="reject">${t('拒绝')}</button>
        <button data-adv="${a.idx}" data-act="pending">${t('重置')}</button>
        <button data-adv-reply="${a.idx}" ${canReply ? '' : 'disabled'}>${t('回复')}</button>
        <button class="danger" data-adv="${a.idx}" data-act="delete">${t('删除')}</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
