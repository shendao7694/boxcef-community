// @path: src/js/admin/handlers/posts.js
import { $, adminFetch, postsCache, setPostsCache } from '../state.js';
import { renderPosts } from '../renders/posts.js';
import { getTagInfo, ensureTagInfo } from './tags.js';
import { showToast } from '../utils/toast.js';
import { confirm } from '../../common/dialog.js';
import { t } from '../../common/i18n.js';

const peSelected = new Set();
let page = 1;
let pageSize = 10;
let query = '';
let cat = '';
let total = 0;
let searchTimer = null;

function updatePager() {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  $('post-page-info').textContent = `${page} / ${pages}`;
  $('post-page-prev').disabled = page <= 1;
  $('post-page-next').disabled = page >= pages;
}

export async function loadPosts(reset = false) {
  await ensureTagInfo();
  if (reset) page = 1;
  try {
    const url = `/api/admin/post/list?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(query)}&cat=${encodeURIComponent(cat)}`;
    const data = await adminFetch(url);
    setPostsCache(data.posts || []);
    total = Number(data.total) || (data.posts || []).length;
  } catch {
    setPostsCache([]);
    total = 0;
  }
  renderPosts(total);
  updatePager();
  fillCommentPostSelect();
}

export async function deletePost(id) {
  const ok = await confirm(t('确认删除该帖子？该操作不可恢复'), { danger: true });
  if (!ok) return;
  try {
    await adminFetch('/api/admin/post/delete', { method: 'POST', body: { id } });
    showToast(t('已删除'));
    await loadPosts(false);
    if (!postsCache.length && page > 1) {
      page -= 1;
      await loadPosts(false);
    }
  } catch {}
}

export async function togglePin(id, isPinned) {
  try {
    await adminFetch('/api/admin/post/pin', {
      method: 'POST',
      body: { id, action: isPinned ? 'unpin' : 'pin' }
    });
    showToast(isPinned ? t('已取消置顶') : t('已置顶'));
    await loadPosts(false);
  } catch {}
}

export async function openPostEdit(pid) {
  try {
    await ensureTagInfo();
    const data = await adminFetch(`/api/admin/post/edit?id=${encodeURIComponent(pid)}`);
    $('pe-id').value = data.post.id;
    $('pe-title').value = data.post.title || '';
    $('pe-content').value = data.post.content || '';
    renderPeTags(data.post.type || []);
    $('post-edit-modal').hidden = false;
  } catch {}
}

function renderPeTags(selected) {
  peSelected.clear();
  for (const tag of selected) peSelected.add(tag);
  const box = $('pe-tags');
  box.innerHTML = '';
  const tags = getTagInfo().postTags;
  if (!tags.length) {
    box.innerHTML = `<span style="color:var(--text-soft);font-size:13px">${t('标签字典加载失败')}</span>`;
    return;
  }
  for (const tag of tags) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag-picker-chip' + (peSelected.has(tag) ? ' active' : '');
    chip.textContent = tag;
    chip.addEventListener('click', () => {
      if (peSelected.has(tag)) {
        peSelected.delete(tag);
        chip.classList.remove('active');
      } else if (peSelected.size < 5) {
        peSelected.add(tag);
        chip.classList.add('active');
      } else {
        showToast(t('最多选择 5 个分类'), 'error');
      }
    });
    box.appendChild(chip);
  }
}

export function fillCommentPostSelect() {
  const sel = $('comment-post-select');
  sel.innerHTML = `<option value="">${t('选择帖子…')}</option>`;
  for (const p of postsCache) {
    const opt = document.createElement('option');
    opt.value = p.id;
    const title = (p.title || t('无标题')).slice(0, 30);
    const who = p.writerInfo ? (p.writerInfo.nickname || p.writerInfo.name) : '';
    opt.textContent = who ? `${title} · ${who}` : title;
    sel.appendChild(opt);
  }
}

export function bindPosts() {
  const search = $('post-search');
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        query = search.value.trim();
        loadPosts(true);
      }, 300);
    });
  }

  $('post-cat-filter').addEventListener('change', () => {
    cat = $('post-cat-filter').value;
    loadPosts(true);
  });

  $('post-page-size').addEventListener('change', () => {
    pageSize = Number($('post-page-size').value) || 10;
    loadPosts(true);
  });
  $('post-page-prev').addEventListener('click', () => {
    if (page <= 1) return;
    page -= 1;
    loadPosts(false);
  });
  $('post-page-next').addEventListener('click', () => {
    page += 1;
    loadPosts(false);
  });

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
      content: $('pe-content').value,
      type: [...peSelected]
    };
    if (!payload.content.trim()) { showToast(t('内容不能为空'), 'error'); return; }
    const btn = $('pe-save');
    btn.disabled = true;
    btn.textContent = t('保存中...');
    try {
      await adminFetch('/api/admin/post/edit', { method: 'POST', body: payload });
      showToast(t('帖子已更新'));
      $('post-edit-modal').hidden = true;
      await loadPosts(false);
    } catch {}
    btn.disabled = false;
    btn.textContent = t('保存修改');
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
