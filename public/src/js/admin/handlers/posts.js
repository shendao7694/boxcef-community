// @path: src/js/admin/handlers/posts.js
import { $, adminFetch, postsCache, setPostsCache } from '../state.js';
import { renderPosts } from '../renders/posts.js';
import { showToast } from '../utils/toast.js';

export async function deletePost(id) {
  if (!confirm('确认删除该帖子？该操作不可恢复')) return;
  try {
    await adminFetch('/api/admin/post/delete', { method: 'POST', body: { id } });
    showToast('已删除');
    setPostsCache(postsCache.filter(p => p.id !== id));
    renderPosts();
  } catch {}
}

export async function togglePin(id, isPinned) {
  try {
    await adminFetch('/api/admin/post/pin', {
      method: 'POST',
      body: { id, action: isPinned ? 'unpin' : 'pin' }
    });
    showToast(isPinned ? '已取消置顶' : '已置顶');
    await window.__loadPosts();
  } catch {}
}

export async function openPostEdit(pid) {
  try {
    const data = await adminFetch(`/api/admin/post/edit?id=${encodeURIComponent(pid)}`);
    $('pe-id').value = data.post.id;
    $('pe-title').value = data.post.title || '';
    $('pe-content').value = data.post.content || '';
    $('post-edit-modal').hidden = false;
  } catch {}
}

export function fillCommentPostSelect() {
  const sel = $('comment-post-select');
  sel.innerHTML = '<option value="">选择帖子…</option>';
  for (const p of postsCache) {
    const opt = document.createElement('option');
    opt.value = p.id;
    const title = (p.title || '无标题').slice(0, 30);
    const who = p.writerInfo ? (p.writerInfo.nickname || p.writerInfo.name) : '';
    opt.textContent = who ? `${title} · ${who}` : title;
    sel.appendChild(opt);
  }
}

export function bindPosts() {
  $('post-search').addEventListener('input', renderPosts);

  $('pe-cancel').addEventListener('click', () => {
    $('post-edit-modal').hidden = true;
  });

  $('post-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pid = $('pe-id').value;
    if (!pid) return;
    const payload = {
      id: pid,
      title: $('pe-title').value.trim(),
      content: $('pe-content').value
    };
    if (!payload.content.trim()) { showToast('内容不能为空', 'error'); return; }
    const btn = $('pe-save');
    btn.disabled = true;
    btn.textContent = '保存中...';
    try {
      await adminFetch('/api/admin/post/edit', { method: 'POST', body: payload });
      showToast('帖子已更新');
      $('post-edit-modal').hidden = true;
      await window.__loadPosts();
    } catch {}
    btn.disabled = false;
    btn.textContent = '保存修改';
  });

  $('posts-table').querySelector('tbody').addEventListener('click', (e) => {
    const open = e.target.closest('button[data-open-post]');
    const edit = e.target.closest('button[data-edit-post]');
    const cmt = e.target.closest('button[data-cmt-post]');
    const pin = e.target.closest('button[data-pin]');
    const del = e.target.closest('button[data-del-post]');
    if (open) window.open(`/post.html?id=${open.dataset.openPost}`, '_blank');
    if (edit) openPostEdit(edit.dataset.editPost);
    if (cmt) window.__gotoComments(cmt.dataset.cmtPost);
    if (pin) togglePin(pin.dataset.pin, pin.dataset.pinned === '1');
    if (del) deletePost(del.dataset.delPost);
  });
}