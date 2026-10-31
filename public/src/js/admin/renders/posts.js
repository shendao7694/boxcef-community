// @path: src/js/admin/renders/posts.js
import { $, postsCache } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { fmtTime, SVG_PIN } from '../utils/format.js';

export function renderPosts() {
  const search = $('post-search');
  const q = (search?.value || '').trim().toLowerCase();
  const cat = $('post-cat-filter')?.value || '';

  const filtered = postsCache.filter(p => {
    if (cat && !(Array.isArray(p.type) && p.type.includes(cat))) return false;
    if (!q) return true;
    const hay = `${p.title || ''} ${p.writerInfo?.name || ''} ${p.writerInfo?.nickname || ''}`.toLowerCase();
    return hay.includes(q);
  });

  $('post-count').textContent = filtered.length;
  const tbody = $('posts-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">暂无帖子</td></tr>';
    return;
  }

  for (const p of filtered) {
    const w = p.writerInfo;
    const author = w
      ? `<a href="/user.html?id=${p.writer}" target="_blank" rel="noopener">${escapeHtml(w.nickname || w.name)}</a>`
      : '<span style="color:var(--text-soft)">未知</span>';
    const tagsHtml = (Array.isArray(p.type) && p.type.length)
      ? p.type.map(t => `<span class="post-tag">#${escapeHtml(t)}</span>`).join(' ')
      : '<span style="color:var(--text-soft)">-</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${escapeHtml(p.id)}</td>
      <td>${p.pinned ? `<span class="pin-flag">${SVG_PIN}</span>` : ''}${escapeHtml(p.title || '无标题')}</td>
      <td>${tagsHtml}</td>
      <td>${author}</td>
      <td>${p.like || 0}</td>
      <td>${p.commentCount || 0}</td>
      <td>${fmtTime(p.createdAt)}</td>
      <td class="row-actions">
        <button data-open-post="${p.id}">打开</button>
        <button data-edit-post="${p.id}">编辑</button>
        <button data-cmt-post="${p.id}">评论</button>
        <button data-pin="${p.id}" data-pinned="${p.pinned ? '1' : '0'}">${p.pinned ? '取消置顶' : '置顶'}</button>
        <button class="danger" data-del-post="${p.id}">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}
