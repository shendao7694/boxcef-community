// @path: src/js/profile.js
import { request } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe, avatarUrl } from '../js/common/auth.js';
import { getTitle, renderTitleTag } from '../js/common/title.js';

const $ = (id) => document.getElementById(id);

let current = null;
let currentTab = 'mutual';
let pendingAvatarHash = null;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function renderUser(user) {
  $('avatar-img').src = avatarUrl(user.avatar);

  const tagInfo = user.title?.choose ? await getTitle(user.title.choose) : null;
  const tagHtml = tagInfo ? renderTitleTag(user.title, { [user.title.choose]: tagInfo }) : '';

  $('meta-name').innerHTML = `${escapeHtml(user.name)}${tagHtml}`;
  $('meta-nickname').textContent = user.nickname || '';
  $('meta-group').textContent = user.group;
  $('meta-login').textContent = new Date(user.lastLoginTime).toLocaleString();
  $('side-desc').textContent = user.description || '还没有填写简介';
}

function renderPosts(posts) {
  const box = $('posts-box');
  if (!box) return;
  box.innerHTML = '';

  if (!posts.length) {
    box.innerHTML = '<div class="empty-text">还没有发布过帖子</div>';
    return;
  }

  for (const p of posts) {
    const item = document.createElement('a');
    item.className = 'post-item';
    item.href = `/post.html?id=${p.id}`;
    item.innerHTML = `
      <div class="post-item-main">
        <div class="post-item-title">${escapeHtml(p.title || '无标题')}</div>
        <div class="post-item-preview">${escapeHtml(p.preview || '')}</div>
      </div>
      <div class="post-item-meta">
        <span>${p.like || 0} 赞</span>
        <span>${p.commentCount || 0} 评论</span>
        <span>${new Date(p.createdAt || 0).toLocaleDateString()}</span>
      </div>
    `;
    box.appendChild(item);
  }
}

async function loadPosts() {
  if (!current || !current.sessionKey) return;
  try {
    const data = await request(
      `/api/works/post/list?type=user&id=${encodeURIComponent(current.sessionKey)}`,
      { auth: true }
    );
    renderPosts(data.posts || []);
  } catch {
    const box = $('posts-box');
    if (box) box.innerHTML = '<div class="empty-text">加载失败</div>';
  }
}

async function loadBoxplays() {
  if (!current || !current.sessionKey) return;
  const box = $('boxplays-box');
  if (!box) return;
  
  try {
    const data = await request(
      `/api/works/boxplay/list?type=user&id=${encodeURIComponent(current.sessionKey)}`,
      { auth: true }
    );
    const list = data.boxplays || [];
    if (!list.length) {
      box.innerHTML = '<div class="empty-text">还没有发布过作品</div>';
      return;
    }

    box.innerHTML = '';
    for (const b of list) {
      const item = document.createElement('div');
      item.className = 'post-item';
      item.style.cursor = 'default';

      let statusText = '待审核', statusColor = '#f59e0b';
      if (b.status === 'approved') { statusText = '已通过'; statusColor = '#22c55e'; }
      if (b.status === 'rejected') { statusText = '已拒绝'; statusColor = '#ff4d4d'; }

      item.innerHTML = `
        <div class="post-item-main">
          <div class="post-item-title" style="cursor:pointer;" onclick="location.href='/boxview.html?id=${b.id}'">
            ${escapeHtml(b.title)} 
            <span style="font-size:11px; border:1px solid ${statusColor}; color:${statusColor}; padding:1px 6px; border-radius:4px; margin-left:8px; vertical-align:middle;">${statusText}</span>
          </div>
          <div class="post-item-preview">${escapeHtml(b.description || '')}</div>
        </div>
        <div class="post-item-meta">
          <span>${new Date(b.createdAt).toLocaleDateString()}</span>
          <button class="btn btn-danger btn-sm" data-del="${b.id}" style="padding: 4px 10px; font-size: 12px; border-radius: 6px;">删除/撤销</button>
        </div>
      `;
      
      item.querySelector('[data-del]').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('确认删除该作品？如果正在审核中将直接撤销。')) return;
        try {
          await request('/api/works/boxplay/delete', {
            method: 'POST', auth: true, body: { id: b.id }
          });
          showToast('已删除');
          await loadBoxplays();
          // 更新本地缓存的boxplays数量限制
          const user = await fetchMe();
          if (user) current = user;
        } catch {}
      });

      box.appendChild(item);
    }
  } catch {
    box.innerHTML = '<div class="empty-text">加载失败</div>';
  }
}

async function renderTitlePicker() {
  const box = $('title-picker');
  if (!box) return;
  box.innerHTML = '';

  const mine = current.title || { own: [], choose: '' };
  const own = Array.isArray(mine.own) ? mine.own : [];
  const choose = mine.choose || '';

  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'title-chip none' + (choose ? '' : ' active');
  none.textContent = '不展示';
  none.addEventListener('click', () => chooseTitle(''));
  box.appendChild(none);

  for (const id of own) {
    const info = await getTitle(id);
    if (!info) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'title-chip' + (choose === id ? ' active' : '');
    const bg = info.background || {};
    if (bg.type === 'image') {
      btn.style.backgroundImage = `url('/api/data/assets/${encodeURIComponent(bg.data)}')`;
      btn.style.backgroundSize = 'cover';
      btn.style.color = '#fff';
    } else {
      btn.style.background = bg.data || '#000';
      btn.style.color = '#fff';
    }
    btn.textContent = info.name;
    btn.addEventListener('click', () => chooseTitle(id));
    box.appendChild(btn);
  }
}

async function chooseTitle(id) {
  try {
    const res = await request('/api/data/title/choose', {
      method: 'POST',
      auth: true,
      body: { id }
    });
    current.title = res.title || current.title;
    showToast('已切换');
    await renderTitlePicker();
    await renderUser(current);
  } catch {}
}

async function init() {
  const user = await fetchMe();
  if (!user) { location.href = '/login.html'; return; }
  current = user;
  await renderUser(user);
  await loadPosts();
  await loadBoxplays();
}

// 绑定编辑资料相关事件
$('edit-btn').addEventListener('click', async () => {
  if (!current) return;
  pendingAvatarHash = null;
  $('edit-avatar-preview').src = avatarUrl(current.avatar);
  $('edit-nickname').value = current.nickname || '';
  $('edit-description').value = current.description || '';
  $('edit-email').value = current.email;
  await renderTitlePicker();
  $('edit-modal').hidden = false;
});

$('edit-close').addEventListener('click', () => { $('edit-modal').hidden = true; });
$('edit-cancel').addEventListener('click', () => { $('edit-modal').hidden = true; });
$('edit-upload-btn').addEventListener('click', () => $('edit-avatar-input').click());

$('edit-avatar-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('图片不能超过 2MB', 'error');
    e.target.value = '';
    return;
  }
  const fd = new FormData();
  fd.append('avatar', file);
  const btn = $('edit-upload-btn');
  btn.disabled = true;
  btn.textContent = '上传中...';
  try {
    const { hash } = await request('/api/data/profile/avatar', {
      method: 'POST', auth: true, isForm: true, body: fd
    });
    pendingAvatarHash = hash;
    current.avatar = hash;
    $('edit-avatar-preview').src = avatarUrl(hash);
    showToast('头像已更新');
  } catch {}
  btn.disabled = false;
  btn.textContent = '更换头像';
  e.target.value = '';
});

$('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('edit-save');
  btn.disabled = true;
  btn.textContent = '保存中...';
  try {
    const { user } = await request('/api/data/profile/update', {
      method: 'POST',
      auth: true,
      body: {
        nickname: $('edit-nickname').value.trim(),
        description: $('edit-description').value
      }
    });
    current = { ...current, ...user };
    if (pendingAvatarHash) current.avatar = pendingAvatarHash;
    await renderUser(current);
    showToast('已保存');
    $('edit-modal').hidden = true;
    pendingAvatarHash = null;
  } catch {}
  btn.disabled = false;
  btn.textContent = '保存修改';
});

// 好友逻辑保持不变
$('friends-btn').addEventListener('click', () => {
  $('friends-modal').hidden = false;
  switchTab('mutual');
});

$('f-close').addEventListener('click', () => { $('friends-modal').hidden = true; });

document.querySelectorAll('#friends-modal .tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

async function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('#friends-modal .tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  $('f-search-row').hidden = tab !== 'search';
  $('f-list').innerHTML = '';

  if (tab === 'search') {
    $('f-search-input').value = '';
    $('f-search-input').focus();
    return;
  }
  await loadList(tab);
}

async function loadList(type, q = '') {
  const url = `/api/data/social/list?type=${encodeURIComponent(type)}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  let data;
  try {
    data = await request(url, { auth: true });
  } catch { return; }
  const users = data.users || [];
  const list = $('f-list');
  list.innerHTML = '';

  if (!users.length) {
    list.innerHTML = `<div class="empty">${type === 'search' && !q ? '输入关键字搜索' : '暂无用户'}</div>`;
    return;
  }

  for (const u of users) {
    const item = document.createElement('div');
    item.className = 'friend-item';
    item.innerHTML = `
      <img src="${avatarUrl(u.avatar)}" alt="">
      <div class="grow">
        <div class="name">${escapeHtml(u.nickname || u.name)}</div>
        <div class="sub">@${escapeHtml(u.name)}</div>
      </div>
    `;
    item.querySelector('.grow').addEventListener('click', () => {
      location.href = `/user.html?id=${u.key}`;
    });

    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost btn-sm';
    btn.textContent = u.isFollowing ? '取关' : '关注';
    btn.dataset.following = u.isFollowing ? '1' : '0';
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isFollowing = btn.dataset.following === '1';
      btn.disabled = true;
      try {
        await request('/api/data/social/follow', {
          method: 'POST', auth: true,
          body: { target: u.key, action: isFollowing ? 'unfollow' : 'follow' }
        });
        btn.dataset.following = isFollowing ? '0' : '1';
        btn.textContent = isFollowing ? '关注' : '取关';
        showToast(isFollowing ? '已取消关注' : '已关注');
      } catch {}
      btn.disabled = false;
    });
    item.appendChild(btn);
    list.appendChild(item);
  }
}

$('f-search-btn').addEventListener('click', () => {
  const q = $('f-search-input').value.trim();
  loadList('search', q);
});

$('f-search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $('f-search-btn').click(); }
});

init();