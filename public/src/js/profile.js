// @path: src/js/profile.js
import { request } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe, avatarUrl } from '../js/common/auth.js';
import { getTitles, renderTitleTag } from '../js/common/title.js';
import { confirm } from '../js/common/dialog.js';
import { t } from '../js/common/i18n.js';

const $ = (id) => document.getElementById(id);

let current = null;
let currentTab = 'mutual';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function renderUser(user) {
  $('avatar-img').src = avatarUrl(user.avatar);

  let tagHtml = '';
  if (user.title?.choose) {
    const titles = await getTitles([user.title.choose]);
    tagHtml = renderTitleTag(user.title, titles);
  }

  $('meta-name').innerHTML = `${escapeHtml(user.name)}${tagHtml}`;
  $('meta-nickname').textContent = user.nickname || '';
  $('meta-group').textContent = user.group;
  $('meta-login').textContent = new Date(user.lastLoginTime).toLocaleString();
  $('side-desc').textContent = user.description || t('还没有填写简介');
}

function renderPosts(posts) {
  const box = $('posts-box');
  if (!box) return;
  box.innerHTML = '';

  if (!posts.length) {
    box.innerHTML = `<div class="empty-text">${t('还没有发布过帖子')}</div>`;
    return;
  }

  for (const post of posts) {
    const item = document.createElement('a');
    item.className = 'post-item';
    item.href = `/post.html?id=${post.id}`;
    item.setAttribute('data-no-i18n', '');
    item.innerHTML = `
      <div class="post-item-main">
        <div class="post-item-title">${escapeHtml(post.title || t('无标题'))}</div>
        <div class="post-item-preview">${escapeHtml(post.preview || '')}</div>
      </div>
      <div class="post-item-meta">
        <span>${post.like || 0} ${t('赞')}</span>
        <span>${post.commentCount || 0} ${t('评论')}</span>
        <span>${new Date(post.createdAt || 0).toLocaleDateString()}</span>
      </div>
    `;
    box.appendChild(item);
  }
}

async function loadPosts() {
  if (!current || !current.sessionKey) return;
  const box = $('posts-box');
  if (box) box.innerHTML = `<div class="empty-text">${t('加载中...')}</div>`;
  try {
    const data = await request(
      `/api/works/post/list?type=user&id=${encodeURIComponent(current.sessionKey)}`,
      { auth: true }
    );
    renderPosts(data.posts || []);
  } catch {
    const box = $('posts-box');
    if (box) box.innerHTML = `<div class="empty-text">${t('加载失败')}</div>`;
  }
}

async function loadBoxplays() {
  if (!current || !current.sessionKey) return;
  const box = $('boxplays-box');
  if (!box) return;
  box.innerHTML = `<div class="empty-text">${t('加载中...')}</div>`;

  try {
    const data = await request(
      `/api/works/boxplay/list?type=user&id=${encodeURIComponent(current.sessionKey)}`,
      { auth: true }
    );
    const list = data.boxplays || [];
    if (!list.length) {
      box.innerHTML = `<div class="empty-text">${t('还没有发布过作品')}</div>`;
      return;
    }

    box.innerHTML = '';
    for (const work of list) {
      const item = document.createElement('div');
      item.className = 'post-item';
      item.style.cursor = 'default';
      item.setAttribute('data-no-i18n', '');

      let statusText = t('待审核'), statusColor = '#f59e0b';
      if (work.status === 'approved') { statusText = t('已通过'); statusColor = '#22c55e'; }
      if (work.status === 'rejected') { statusText = t('已拒绝'); statusColor = '#ff4d4d'; }

      const commentCount = (work.comments || []).length;

      item.innerHTML = `
        <div class="post-item-main">
          <div class="post-item-title" style="cursor:pointer;" data-open="${work.id}">
            ${escapeHtml(work.title)}
            <span style="font-size:11px; border:1px solid ${statusColor}; color:${statusColor}; padding:1px 6px; border-radius:4px; margin-left:8px; vertical-align:middle;">${statusText}</span>
          </div>
          <div class="post-item-preview">${escapeHtml(work.description || '')}</div>
        </div>
        <div class="post-item-meta" style="display: flex; align-items: center; gap: 14px;">
          <span>${commentCount} ${t('评论')}</span>
          <span>${new Date(work.createdAt).toLocaleDateString()}</span>
          <button class="btn btn-danger btn-sm" data-del="${work.id}" style="padding: 4px 10px; font-size: 12px; border-radius: 6px; margin-left: 8px;">${t('删除/撤销')}</button>
        </div>
      `;

      item.querySelector('[data-open]').addEventListener('click', () => {
        location.href = `/boxview.html?id=${work.id}`;
      });

      item.querySelector('[data-del]').addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await confirm(t('确认删除该作品？如果正在审核中将直接撤销。'), { danger: true });
        if (!ok) return;
        try {
          await request('/api/works/boxplay/delete', {
            method: 'POST', auth: true, body: { id: work.id }
          });
          showToast(t('已删除'));
          await loadBoxplays();
          const user = await fetchMe({ force: true });
          if (user) current = user;
        } catch {}
      });

      box.appendChild(item);
    }
  } catch {
    box.innerHTML = `<div class="empty-text">${t('加载失败')}</div>`;
  }
}

function openFriends() {
  $('friends-overlay').hidden = false;
  $('friends-panel').hidden = false;
  switchTab('mutual');
}

function closeFriends() {
  $('friends-overlay').hidden = true;
  $('friends-panel').hidden = true;
}

async function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('#friends-panel .tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  $('f-list').innerHTML = '';
  await loadList(tab);
}

async function loadList(type) {
  const url = `/api/data/social/list?type=${encodeURIComponent(type)}`;
  let data;
  try {
    data = await request(url, { auth: true });
  } catch { return; }
  const users = data.users || [];
  const list = $('f-list');
  list.innerHTML = '';

  if (!users.length) {
    list.innerHTML = `<div class="empty">${t('暂无用户')}</div>`;
    return;
  }

  for (const user of users) {
    const item = document.createElement('div');
    item.className = 'friend-item';
    item.setAttribute('data-no-i18n', '');
    item.innerHTML = `
      <img loading="lazy" decoding="async" src="${avatarUrl(user.avatar)}" alt="">
      <div class="grow">
        <div class="name">${escapeHtml(user.nickname || user.name)}</div>
        <div class="sub">@${escapeHtml(user.name)}</div>
      </div>
    `;
    item.querySelector('.grow').addEventListener('click', () => {
      location.href = `/user.html?id=${user.key}`;
    });

    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost btn-sm';
    btn.textContent = user.isFollowing ? t('取关') : t('关注');
    btn.dataset.following = user.isFollowing ? '1' : '0';
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isFollowing = btn.dataset.following === '1';
      btn.disabled = true;
      try {
        await request('/api/data/social/follow', {
          method: 'POST', auth: true,
          body: { target: user.key, action: isFollowing ? 'unfollow' : 'follow' }
        });
        btn.dataset.following = isFollowing ? '0' : '1';
        btn.textContent = isFollowing ? t('关注') : t('取关');
        showToast(isFollowing ? t('已取消关注') : t('已关注'));
      } catch {}
      btn.disabled = false;
    });
    item.appendChild(btn);
    list.appendChild(item);
  }
}

async function init() {
  const user = await fetchMe();
  if (!user) { location.href = '/login.html'; return; }
  current = user;
  await Promise.all([renderUser(user), loadPosts(), loadBoxplays()]);
}

$('edit-btn').addEventListener('click', () => {
  location.href = '/settings.html';
});

$('friends-btn').addEventListener('click', openFriends);
$('f-close').addEventListener('click', closeFriends);
$('friends-overlay').addEventListener('click', closeFriends);

document.querySelectorAll('#friends-panel .tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('friends-panel').hidden) closeFriends();
});

init();
