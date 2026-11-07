// @path: src/js/admin/renders/posts.js
import { $, postsCache } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, SVG_PIN } from '../utils/format.js';
import { t } from '../../common/i18n.js';

export function renderPosts(total = postsCache.length) {
  $('post-count').textContent = total;
  const tbody = $('posts-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!postsCache.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">${t('暂无帖子')}</td></tr>`;
    return;
  }

  for (const p of postsCache) {
    const w = p.writerInfo;
    const author = w
      ? `<a href="/user.html?id=${p.writer}" target="_blank" rel="noopener">${escapeHtml(w.nickname || w.name)}</a>`
      : `<span style="color:var(--text-soft)">${t('未知')}</span>`;
    const tagsHtml = (Array.isArray(p.type) && p.type.length)
      ? p.type.map(tag => `<span class="post-tag">#${escapeHtml(tag)}</span>`).join(' ')
      : '<span style="color:var(--text-soft)">-</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(p.id)}</td>
      <td>${p.pinned ? `<span class="pin-flag">${SVG_PIN}</span>` : ''}${escapeHtml(p.title || t('无标题'))}</td>
      <td>${tagsHtml}</td>
      <td>${author}</td>
      <td>${p.like || 0}</td>
      <td>${p.commentCount || 0}</td>
      <td>${fmtTime(p.createdAt)}</td>
      <td class="row-actions">
        <button data-open-post="${p.id}">${t('打开')}</button>
        <button data-edit-post="${p.id}">${t('编辑')}</button>
        <button data-cmt-post="${p.id}">${t('评论')}</button>
        <button data-pin="${p.id}" data-pinned="${p.pinned ? '1' : '0'}">${p.pinned ? t('取消置顶') : t('置顶')}</button>
        <button class="danger" data-del-post="${p.id}">${t('删除')}</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
