// @path: src/js/admin/renders/boxplay.js
import { $ } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { avatarImg } from '../utils/format.js';
import { t } from '../../common/i18n.js';

export function renderBoxplayList(items, total = items.length) {
  $('boxplay-count').textContent = total;
  const tbody = $('boxplay-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">${t('暂无作品')}</td></tr>`;
    return;
  }

  for (const b of items) {
    const w = b.writerInfo;
    const author = w
      ? `<span class="cmt-author">${avatarImg(w.avatar)}${escapeHtml(w.nickname || w.name)}</span>`
      : t('未知');

    let statusText = t('待审核'), statusCls = 'status-pending';
    if (b.status === 'approved') { statusText = t('已通过'); statusCls = 'status-accepted'; }
    if (b.status === 'rejected') { statusText = t('已拒绝'); statusCls = 'status-rejected'; }

    const typeHtml = `<span class="bp-type-badge">${escapeHtml(b.type || '其他')}</span>`;
    const modeHtml = b.isInIframe ? 'iframe' : t('直接跳转');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img loading="lazy" decoding="async" src="/api/data/assets/${encodeURIComponent(b.cover)}" style="width:60px;height:45px;object-fit:cover;border-radius:4px;"></td>
      <td>${escapeHtml(b.title)}</td>
      <td>${typeHtml}</td>
      <td>${author}</td>
      <td><a href="${escapeHtml(b.playurl)}" target="_blank" style="color:var(--accent);text-decoration:underline;">${t('前往游玩')}</a></td>
      <td>${modeHtml}</td>
      <td><span class="advice-badge ${statusCls}">${statusText}</span></td>
      <td class="row-actions">
        <button data-bp-edit="${b.id}">${t('编辑')}</button>
        <button data-bp-id="${b.id}" data-bp-act="approve" ${b.status === 'approved' ? 'disabled' : ''}>${t('通过')}</button>
        <button data-bp-id="${b.id}" data-bp-act="pending" ${b.status === 'pending' ? 'disabled' : ''}>${t('重制')}</button>
        <button data-bp-id="${b.id}" data-bp-act="reject" ${b.status === 'rejected' ? 'disabled' : ''}>${t('拒绝')}</button>
        <button data-bp-reply="${b.id}" ${b.status === 'pending' ? 'disabled' : ''}>${t('回复')}</button>
        <button class="danger" data-bp-id="${b.id}" data-bp-act="delete">${t('删除')}</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
