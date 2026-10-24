// @path: src/js/user.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe, avatarUrl } from '../js/common/auth.js';
import { getTitle, renderTitleTag } from '../js/common/title.js';

const $ = (id) => document.getElementById(id);

let targetId = null;
let me = null;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

async function loadProfile() {
  targetId = qs('id');
  if (!targetId) {
    showToast('缺少 id', 'error');
    $('user-empty').querySelector('.empty-text').textContent = '缺少 id 参数';
    return;
  }
  if (!/^[0-9a-f]{64}$/.test(targetId)) {
    showToast('无效的 id', 'error');
    $('user-empty').querySelector('.empty-text').textContent = '无效的 id';
    return;
  }

  me = await fetchMe();
  if (me && me.sessionKey === targetId) {
    location.replace('/profile.html');
    return;
  }

  let data;
  try {
    data = await request(`/api/data/user/get?id=${encodeURIComponent(targetId)}`, {
      auth: !!getToken()
    });
  } catch {
    $('user-empty').querySelector('.empty-text').textContent = '加载失败';
    return;
  }

  await render(data);
}

async function render(data) {
  const u = data.user;

  $('user-empty').hidden = true;
  $('user-card').hidden = false;

  $('u-avatar').src = avatarUrl(u.avatar);

  const tagInfo = u.title?.choose ? await getTitle(u.title.choose) : null;
  const tagHtml = tagInfo ? renderTitleTag(u.title, { [u.title.choose]: tagInfo }) : '';

  $('u-name').innerHTML = `${escapeHtml(u.name)}${tagHtml}`;
  $('u-nickname').textContent = u.nickname || '';
  $('u-group').textContent = u.group || '';
  $('u-following').textContent = data.stats.following;
  $('u-followers').textContent = data.stats.followers;
  $('u-mutual').textContent = data.stats.mutual;
  $('side-desc').textContent = u.description || '这个用户很懒，什么都没写';

  const states = [];
  if (data.isMutual) states.push('互相关注');
  else {
    if (data.isFollowing) states.push('你已关注');
    if (data.isFollower) states.push('对方关注了你');
  }
  $('u-state').textContent = states.join(' · ') || '你们还没有交集';

  const btn = $('follow-btn');
  if (me) {
    btn.hidden = false;
    btn.textContent = data.isFollowing ? '取消关注' : '关注';
    btn.dataset.following = data.isFollowing ? '1' : '0';
  } else {
    btn.hidden = true;
  }

  await loadPosts();
  await loadBoxplays();
}

$('follow-btn').addEventListener('click', async () => {
  if (!targetId) return;
  const btn = $('follow-btn');
  const isFollowing = btn.dataset.following === '1';
  const action = isFollowing ? 'unfollow' : 'follow';
  btn.disabled = true;
  try {
    await request('/api/data/social/follow', {
      method: 'POST',
      auth: true,
      body: { target: targetId, action }
    });
    showToast(isFollowing ? '已取消关注' : '已关注');
    await loadProfile();
  } catch {}
  btn.disabled = false;
});

function renderPosts(posts) {
  const box = $('posts-box');
  if (!box) return;
  box.innerHTML = '';

  if (!posts.length) {
    box.innerHTML = '<div class="empty-text">TA 还没有发布过帖子</div>';
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
  if (!targetId) return;
  try {
    const data = await request(
      `/api/works/post/list?type=user&id=${encodeURIComponent(targetId)}`,
      { auth: !!getToken() }
    );
    renderPosts(data.posts || []);
  } catch (err) {
    console.error('[loadPosts]', err);
    const box = $('posts-box');
    if (box) box.innerHTML = '<div class="empty-text">加载失败</div>';
  }
}

async function loadBoxplays() {
  if (!targetId) return;
  const box = $('boxplays-box');
  if (!box) return;
  
  try {
    const data = await request(
      `/api/works/boxplay/list?type=user&id=${encodeURIComponent(targetId)}`,
      { auth: !!getToken() }
    );
    const list = data.boxplays || [];
    if (!list.length) {
      box.innerHTML = '<div class="empty-text">TA 还没有发布过作品</div>';
      return;
    }

    box.innerHTML = '';
    for (const b of list) {
      // 别人看只能看到已通过的（后端已做过滤，这里防个万一）
      if (b.status !== 'approved') continue;

      const item = document.createElement('a');
      item.className = 'post-item';
      item.href = `/boxview.html?id=${b.id}`;
      item.innerHTML = `
        <div class="post-item-main">
          <div class="post-item-title">${escapeHtml(b.title)}</div>
          <div class="post-item-preview">${escapeHtml(b.description || '')}</div>
        </div>
        <div class="post-item-meta">
          <span>${new Date(b.createdAt).toLocaleDateString()}</span>
        </div>
      `;
      box.appendChild(item);
    }
  } catch {
    box.innerHTML = '<div class="empty-text">加载失败</div>';
  }
}

loadProfile();