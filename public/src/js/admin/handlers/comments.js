// @path: src/js/admin/handlers/comments.js
import { $, adminFetch } from '../state.js';
import { renderComments } from '../renders/comments.js';
import { showToast } from '../utils/toast.js';

export async function loadComments(pid) {
  const tbody = $('comments-table').querySelector('tbody');
  tbody.innerHTML = '';
  if (!pid) {
    $('comments-empty').hidden = false;
    $('comments-empty').textContent = '请选择一个帖子查看其评论';
    $('comments-wrap').hidden = true;
    return;
  }
  $('comments-empty').hidden = false;
  $('comments-empty').textContent = '加载中...';
  $('comments-wrap').hidden = true;

  let data;
  try {
    data = await adminFetch(`/api/admin/comment/list?id=${encodeURIComponent(pid)}`);
  } catch (err) {
    console.error('[loadComments] 请求失败', err);
    $('comments-empty').hidden = false;
    $('comments-empty').textContent = '加载失败：' + (err?.message || '未知错误');
    return;
  }

  const comments = data.comments || [];
  $('comments-empty').hidden = true;
  renderComments(comments);
}

export async function toggleCommentPin(pid, index, isPinned) {
  try {
    await adminFetch('/api/admin/comment/pin', {
      method: 'POST',
      body: { id: pid, index, action: isPinned ? 'unpin' : 'pin' }
    });
    showToast(isPinned ? '已取消置顶' : '已置顶');
    await loadComments(pid);
  } catch {}
}

export async function deleteCommentAdmin(pid, index) {
  if (!confirm('确认删除该评论？该操作不可恢复')) return;
  try {
    await adminFetch('/api/admin/comment/delete', { method: 'POST', body: { id: pid, index } });
    showToast('已删除');
    await loadComments(pid);
  } catch {}
}

export function bindComments() {
  $('comment-post-select').addEventListener('change', (e) => loadComments(e.target.value));

  $('comments-table').querySelector('tbody').addEventListener('click', (e) => {
    const pid = $('comment-post-select').value;
    const pin = e.target.closest('button[data-cmt-pin]');
    const del = e.target.closest('button[data-cmt-del]');
    if (pin) toggleCommentPin(pid, Number(pin.dataset.cmtPin), pin.dataset.pinned === '1');
    if (del) deleteCommentAdmin(pid, Number(del.dataset.cmtDel));
  });
}