// @path: src/js/admin/renders/comments.js
import { $ } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { avatarImg, SVG_PIN } from '../utils/format.js';

export function renderComments(comments) {
  const tbody = $('comments-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!comments.length) {
    $('comments-wrap').hidden = true;
    $('comments-empty').hidden = false;
    $('comments-empty').textContent = '该帖子暂无评论';
    return;
  }

  $('comments-wrap').hidden = false;
  $('comments-empty').hidden = true;

  for (const c of comments) {
    const tr = document.createElement('tr');
    const author = c.author
      ? `<span class="cmt-author">${avatarImg(c.author.avatar)}${escapeHtml(c.author.nickname || c.author.name || '未知')}</span>`
      : '<span style="color:var(--text-soft)">未知</span>';
    tr.innerHTML = `
      <td class="mono">${c.idx}</td>
      <td>${author}</td>
      <td class="cmt-content">${c.pinned ? `<span class="pin-flag">${SVG_PIN}</span>` : ''}${escapeHtml(c.content)}</td>
      <td>${c.replyCount || 0}</td>
      <td>${c.like || 0}</td>
      <td class="row-actions">
        <button data-cmt-pin="${c.idx}" data-pinned="${c.pinned ? '1' : '0'}">${c.pinned ? '取消置顶' : '置顶'}</button>
        <button class="danger" data-cmt-del="${c.idx}">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}