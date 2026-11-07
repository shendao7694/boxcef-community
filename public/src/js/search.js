// @path: src/js/search.js
import { request, getToken } from '../js/common/api.js';
import { fetchMe, avatarUrl } from '../js/common/auth.js';
import { getTitles, renderTitleTag } from '../js/common/title.js';
import { getTagInfo } from '../js/common/tags.js';
import { t } from '../js/common/i18n.js';

const $ = (id) => document.getElementById(id);

const SVG_PIN = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;vertical-align:middle;margin-right:2px;"><path d="M14.5 3.5l6 6-3.5 1.2-3.7 3.7 1.2 5.1-1.4 1.4-4.6-4.6-5.8 5.8-1.4-1.4 5.8-5.8-4.6-4.6L3.9 9.3l5.1 1.2L12.7 7 14.5 3.5z"/></svg>';

const state = {
  tab: 'post',
  query: '',
  match: 'any',
  page: 1,
  hasMore: false,
  postCats: new Set(),
  boxCats: new Set(),
  tags: { postTags: [], boxplayTypes: [] },
  me: null,
  seq: 0
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtTime(time) {
  if (!time) return '';
  const diff = Date.now() - time;
  const min = 60 * 1000;
  if (diff < min) return t('刚刚');
  if (diff < 60 * min) return `${Math.floor(diff / min)} ${t('分钟前')}`;
  if (diff < 24 * 60 * min) return `${Math.floor(diff / (60 * min))} ${t('小时前')}`;
  if (diff < 7 * 24 * 60 * min) return `${Math.floor(diff / (24 * 60 * min))} ${t('天前')}`;
  return new Date(time).toLocaleDateString();
}

function postCard(post, titles, isBox) {
  const a = document.createElement('a');
  a.className = 'card-item';
  a.setAttribute('data-no-i18n', '');
  a.href = isBox ? `/boxview.html?id=${post.id}` : `/post.html?id=${post.id}`;

  const writer = post.writerInfo;
  const avatar = avatarUrl(writer?.avatar || 'COMMON:normal_avatar');
  const authorName = writer ? escapeHtml(writer.nickname || writer.name) : t('未知');
  const titleTag = writer ? renderTitleTag(writer.title, titles) : '';

  const coverHtml = isBox && post.cover
    ? `<img class="card-cover" loading="lazy" decoding="async" src="/api/data/assets/${encodeURIComponent(post.cover)}" alt="">`
    : '';

  const titleText = isBox ? post.title : (post.title || t('无标题'));
  const descText = isBox ? (post.description || t('暂无简介')) : (post.preview || '');
  const pinHtml = post.pinned ? `<span class="tag pin-tag">${SVG_PIN}${t('置顶')}</span>` : '';
  const badge = isBox && post.type
    ? `<span class="card-type-badge">${escapeHtml(post.type)}</span>`
    : '';

  const postType = !isBox && Array.isArray(post.postType) ? post.postType : [];
  const tagsHtml = postType.length
    ? `<div class="card-tags">${postType.map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';

  a.innerHTML = `
    ${coverHtml}
    <div class="card-body">
      <div class="card-title">${pinHtml}${escapeHtml(titleText)}${badge}</div>
      ${tagsHtml}
      <div class="card-desc">${escapeHtml(descText)}</div>
      <div class="card-author">
        <img loading="lazy" decoding="async" src="${avatar}" alt="">
        <span>${authorName}</span>${titleTag}
        <span style="margin-left:auto">${fmtTime(post.createdAt)}</span>
      </div>
    </div>
  `;
  return a;
}

function setStatus(text) {
  $('search-status').textContent = text || '';
}

function showGrid() {
  $('search-grid').hidden = false;
  $('user-results').hidden = true;
}

function showUsers() {
  $('search-grid').hidden = true;
  $('user-results').hidden = false;
}

async function loadPosts(append = false) {
  const grid = $('search-grid');
  if (!append) {
    state.page = 1;
    grid.innerHTML = `<div class="feed-loading" style="grid-column:1/-1">${t('加载中...')}</div>`;
  }
  const seq = ++state.seq;
  const cats = [...state.postCats].join(',');
  let url = `/api/works/post/feed?page=${state.page}&q=${encodeURIComponent(state.query)}`;
  if (cats) url += `&cats=${encodeURIComponent(cats)}&match=${state.match}`;

  try {
    const data = await request(url, { auth: !!getToken() });
    if (seq !== state.seq) return;
    const posts = (data.posts || []).map(post => ({
      ...post,
      postType: Array.isArray(post.type) ? post.type : (post.type ? [post.type] : [])
    }));
    state.hasMore = !!data.hasMore;
    if (!append) grid.innerHTML = '';

    if (!posts.length && !append) {
      setStatus(state.query ? t('没有找到相关内容') : t('这里空空如也'));
      $('search-more').hidden = true;
      return;
    }
    setStatus('');

    const ids = posts.map(post => post.writerInfo?.title?.choose).filter(Boolean);
    const titles = ids.length ? await getTitles(ids) : {};
    if (seq !== state.seq) return;

    const fragment = document.createDocumentFragment();
    for (const post of posts) fragment.appendChild(postCard(post, titles, false));
    grid.appendChild(fragment);
    $('search-more').hidden = !state.hasMore;
  } catch {
    if (seq !== state.seq) return;
    setStatus(t('加载失败'));
  }
}

async function loadBoxplays() {
  const grid = $('search-grid');
  grid.innerHTML = `<div class="feed-loading" style="grid-column:1/-1">${t('加载中...')}</div>`;
  const seq = ++state.seq;
  const cats = [...state.boxCats].join(',');
  let url = '/api/works/boxplay/list?type=all';
  if (cats) url += `&cats=${encodeURIComponent(cats)}`;

  try {
    const data = await request(url, { auth: !!getToken() });
    if (seq !== state.seq) return;
    const q = state.query.toLowerCase();
    let list = (data.boxplays || []).map(box => ({ ...box, type: box.type || '其他' }));
    if (q) {
      list = list.filter(box =>
        (box.title || '').toLowerCase().includes(q) ||
        (box.description || '').toLowerCase().includes(q)
      );
    }
    grid.innerHTML = '';
    if (!list.length) {
      setStatus(state.query ? t('没有找到相关内容') : t('这里空空如也'));
      return;
    }
    setStatus('');
    const ids = list.map(box => box.writerInfo?.title?.choose).filter(Boolean);
    const titles = ids.length ? await getTitles(ids) : {};
    const fragment = document.createDocumentFragment();
    for (const box of list) fragment.appendChild(postCard(box, titles, true));
    grid.appendChild(fragment);
  } catch {
    if (seq !== state.seq) return;
    setStatus(t('加载失败'));
  }
}

function userItem(user) {
  const item = document.createElement('div');
  item.className = 'user-result';
  item.setAttribute('data-no-i18n', '');
  item.innerHTML = `
    <img loading="lazy" decoding="async" src="${avatarUrl(user.avatar)}" alt="">
    <div class="user-result-main">
      <div class="user-result-name">${escapeHtml(user.nickname || user.name)}</div>
      <div class="user-result-sub">@${escapeHtml(user.name)}</div>
      <div class="user-result-desc">${escapeHtml(user.description || '')}</div>
    </div>
  `;
  item.querySelector('.user-result-main').addEventListener('click', () => {
    location.href = `/user.html?id=${user.key}`;
  });
  item.querySelector('.user-result-main').style.cursor = 'pointer';

  if (state.me && state.me.sessionKey !== user.key) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost btn-sm';
    btn.textContent = user.isFollowing ? t('取关') : t('关注');
    btn.addEventListener('click', async () => {
      const isFollowing = !!user.isFollowing;
      btn.disabled = true;
      try {
        await request('/api/data/social/follow', {
          method: 'POST',
          auth: true,
          body: { target: user.key, action: isFollowing ? 'unfollow' : 'follow' }
        });
        user.isFollowing = !isFollowing;
        btn.textContent = user.isFollowing ? t('取关') : t('关注');
      } catch {}
      btn.disabled = false;
    });
    item.appendChild(btn);
  }
  return item;
}

async function loadUsers() {
  const box = $('user-results');
  box.innerHTML = `<div class="feed-loading">${t('加载中...')}</div>`;
  const seq = ++state.seq;
  if (!state.query) {
    box.innerHTML = `<div class="feed-empty">${t('输入关键字搜索')}</div>`;
    return;
  }
  try {
    const data = await request(`/api/data/user/search?q=${encodeURIComponent(state.query)}`, { auth: !!getToken() });
    if (seq !== state.seq) return;
    const users = data.users || [];
    box.innerHTML = '';
    if (!users.length) {
      box.innerHTML = `<div class="feed-empty">${t('暂无用户')}</div>`;
      return;
    }
    for (const user of users) box.appendChild(userItem(user));
  } catch {
    if (seq !== state.seq) return;
    box.innerHTML = `<div class="feed-empty">${t('加载失败')}</div>`;
  }
}

function updateFilterVisibility() {
  const showPost = state.tab === 'post';
  const showBox = state.tab === 'boxplay';
  const postVisible = showPost && state.tags.postTags.length > 0;
  const boxVisible = showBox && state.tags.boxplayTypes.length > 0;
  $('cat-group-post').hidden = !postVisible;
  $('cat-group-box').hidden = !boxVisible;
  $('cat-match').hidden = !postVisible;
  $('cat-filter').hidden = !postVisible && !boxVisible;
}

function renderChips(container, tags, selected) {
  container.innerHTML = '';
  for (const tag of tags) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cat-chip' + (selected.has(tag) ? ' active' : '');
    chip.textContent = tag;
    chip.addEventListener('click', () => {
      if (selected.has(tag)) selected.delete(tag);
      else selected.add(tag);
      chip.classList.toggle('active', selected.has(tag));
      reload();
    });
    container.appendChild(chip);
  }
}

function reload() {
  setStatus('');
  $('search-more').hidden = true;
  if (state.tab === 'post') {
    showGrid();
    loadPosts();
  } else if (state.tab === 'boxplay') {
    showGrid();
    loadBoxplays();
  } else {
    showUsers();
    loadUsers();
  }
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.search-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  updateFilterVisibility();
  reload();
}

function submitSearch() {
  state.query = ($('search-input').value || '').trim();
  const url = new URL(location.href);
  url.searchParams.set('content', state.query);
  history.replaceState(null, '', url.toString());
  reload();
}

async function init() {
  const params = new URLSearchParams(location.search);
  state.query = (params.get('content') || '').trim();
  $('search-input').value = state.query;

  if (getToken()) state.me = await fetchMe();

  state.tags = await getTagInfo();
  renderChips($('cat-chips-post'), state.tags.postTags, state.postCats);
  renderChips($('cat-chips-box'), state.tags.boxplayTypes, state.boxCats);
  updateFilterVisibility();

  $('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    submitSearch();
  });

  document.querySelectorAll('.search-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $('cat-filter-toggle').addEventListener('click', () => {
    $('cat-filter').classList.toggle('collapsed');
  });

  $('cat-match').addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-match-btn');
    if (!btn || btn.classList.contains('active')) return;
    state.match = btn.dataset.match;
    document.querySelectorAll('.cat-match-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.match === state.match);
    });
    reload();
  });

  $('load-more-btn').addEventListener('click', () => {
    if (!state.hasMore) return;
    state.page += 1;
    loadPosts(true);
  });

  reload();
}

init();
