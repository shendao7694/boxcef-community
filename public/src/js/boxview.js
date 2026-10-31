// @path: src/js/boxview.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { avatarUrl, fetchMe } from '../js/common/auth.js';
import { createCommentSection } from '../js/common/comments.js';

const $ = (id) => document.getElementById(id);

let boxId = null;
let boxData = null;
let isAuthor = false;
let isLoggedIn = false;
let me = null;

const comments = createCommentSection({
  endpoint: '/api/works/boxplay/comment',
  getTargetId: () => boxId,
  isLoggedIn: () => isLoggedIn,
  getMe: () => me,
  isAuthor: () => isAuthor,
  getComments: () => boxData?.comments || [],
  setComments: (list) => { if (boxData) boxData.comments = list; },
  opLabel: '作者'
});

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function load() {
  boxId = new URLSearchParams(location.search).get('id');
  if (!boxId) { showToast('缺少 id', 'error'); return; }
  
  if (getToken()) me = await fetchMe();

  let data;
  try {
    data = await request(`/api/works/boxplay/get?id=${encodeURIComponent(boxId)}`, { auth: !!getToken() });
  } catch {
    return;
  }

  boxData = data.boxplay;
  isAuthor = data.isAuthor;
  isLoggedIn = !!me;

  $('main-layout').hidden = false;
  $('comments-wrap').hidden = false;

  $('bv-cover').src = `/api/data/assets/${encodeURIComponent(boxData.cover)}`;
  $('bv-title').textContent = boxData.title;
  $('bv-desc').textContent = boxData.description || '暂无简介';
  $('bv-time').textContent = new Date(boxData.createdAt).toLocaleString();
  
  const w = boxData.writerInfo;
  if (w) {
    $('bv-avatar').src = avatarUrl(w.avatar);
    $('bv-author-name').innerHTML = `<a href="/user.html?id=${boxData.writer}" style="color:var(--text);text-decoration:underline;">${escapeHtml(w.nickname || w.name)}</a>`;
  }

  if (isLoggedIn) {
    $('comment-form').hidden = false;
    $('comment-login-hint').hidden = true;
  } else {
    $('comment-form').hidden = true;
    $('comment-login-hint').hidden = false;
  }

  comments.render(boxData.comments || []);
}

$('start-btn').addEventListener('click', () => {
  location.href = `/boxplay.html?id=${boxId}`;
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