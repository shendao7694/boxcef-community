// @path: src/js/post.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { avatarUrl, fetchMe } from '../js/common/auth.js';
import { getTitle, renderTitleTag } from '../js/common/title.js';
import { createCommentSection } from '../js/common/comments.js';

const $ = (id) => document.getElementById(id);

let postId = null;
let postData = null;
let isAuthor = false;
let isLoggedIn = false;
let me = null;
let writerTitles = {};

const comments = createCommentSection({
  endpoint: '/api/works/post/comment',
  getTargetId: () => postId,
  isLoggedIn: () => isLoggedIn,
  getMe: () => me,
  isAuthor: () => isAuthor,
  getComments: () => postData?.comments || [],
  setComments: (list) => { if (postData) postData.comments = list; },
  opLabel: '贴主'
});

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function renderMarkdown(src) {
  if (typeof marked === 'undefined') {
    return escapeHtml(src).replace(/\n/g, '<br>');
  }
  marked.setOptions({ breaks: true, gfm: true });
  return marked.parse(src);
}

async function load() {
  postId = qs('id');
  if (!postId || !/^[0-9a-f]{64}$/.test(postId)) {
    $('post-empty').querySelector('.empty-text').textContent = '无效的帖子 id';
    return;
  }
  if (getToken()) me = await fetchMe();

  let data;
  try {
    data = await request(`/api/works/post/get?id=${encodeURIComponent(postId)}`, {
      auth: !!getToken()
    });
  } catch {
    $('post-empty').querySelector('.empty-text').textContent = '加载失败';
    return;
  }
  postData = data.post;
  isAuthor = data.isAuthor;
  isLoggedIn = data.isLoggedIn;

  if (postData.writerInfo?.title?.choose) {
    const t = await getTitle(postData.writerInfo.title.choose);
    writerTitles = t ? { [postData.writerInfo.title.choose]: t } : {};
  } else {
    writerTitles = {};
  }

  renderPost();
}

function renderPost() {
  $('post-empty').hidden = true;
  $('post-card').hidden = false;

  const w = postData.writerInfo;
  if (w) {
    $('author-avatar').src = avatarUrl(w.avatar);
    const tag = renderTitleTag(w.title, writerTitles);
    $('author-name').innerHTML = `<a href="/user.html?id=${postData.writer}">${escapeHtml(w.nickname || w.name)}</a>${tag}`;
  } else {
    $('author-avatar').src = avatarUrl('COMMON:normal_avatar');
    $('author-name').textContent = '未知用户';
  }
  $('post-time').textContent = new Date(postData.createdAt).toLocaleString();
  $('post-title').textContent = postData.title || '';
  $('post-content').innerHTML = renderMarkdown(postData.content);

  if (isAuthor) $('delete-btn').hidden = false;

  updateLikeUI(postData.like, postData.liked);

  if (isLoggedIn) {
    $('comment-form').hidden = false;
    $('comment-login-hint').hidden = true;
  } else {
    $('comment-form').hidden = true;
    $('comment-login-hint').hidden = false;
  }

  comments.render(postData.comments || []);
}

function updateLikeUI(count, liked) {
  $('like-btn').classList.toggle('active', !!liked);
  $('like-btn').textContent = '';
  const span = document.createElement('span');
  span.id = 'like-count';
  span.textContent = count;
  $('like-btn').appendChild(span);
  $('like-btn').appendChild(document.createTextNode(liked ? ' 已赞' : ' 赞'));
}

$('like-btn').addEventListener('click', async () => {
  if (!isLoggedIn) { showToast('请先登录', 'error'); return; }
  const liked = $('like-btn').classList.contains('active');
  const action = liked ? 'unlike' : 'like';
  try {
    const res = await request('/api/works/post/like', {
      method: 'POST', auth: true, body: { id: postId, action }
    });
    updateLikeUI(res.like, res.liked);
  } catch {}
});

$('delete-btn').addEventListener('click', async () => {
  if (!confirm('确认删除该帖子？此操作不可恢复')) return;
  try {
    await request('/api/works/post/delete', {
      method: 'POST', auth: true, body: { id: postId }
    });
    showToast('已删除');
    setTimeout(() => { location.href = '/profile.html'; }, 600);
  } catch {}
});

$('comment-submit').addEventListener('click', async () => {
  const content = $('comment-input').value.trim();
  if (!content) { showToast('评论不能为空', 'error'); return; }
  try {
    await comments.add(content);
    $('comment-input').value = '';
  } catch {}
});

load();