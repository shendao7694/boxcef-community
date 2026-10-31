// @path: src/js/index.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { avatarUrl } from '../js/common/auth.js';
import { getTitles, renderTitleTag } from '../js/common/title.js';
import { getTagInfo } from '../js/common/tags.js';

const $ = (id) => document.getElementById(id);

const SVG_PIN = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;vertical-align:middle;margin-right:2px;"><path d="M14.5 3.5l6 6-3.5 1.2-3.7 3.7 1.2 5.1-1.4 1.4-4.6-4.6-5.8 5.8-1.4-1.4 5.8-5.8-4.6-4.6L3.9 9.3l5.1 1.2L12.7 7 14.5 3.5z"/></svg>';

let currentTab = 'recommend';
let query = '';
let matchMode = 'any';
let feedSeq = 0;
const feedCache = new Map();
const FEED_TTL = 30 * 1000;
const selectedPostCats = new Set();
const selectedBoxCats = new Set();

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtTime(t) {
  if (!t) return '';
  const diff = Date.now() - t;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(t).toLocaleDateString();
}

function calcScore(item) {
  const comments = item.commentCount || 0;
  const like = item.like || 0;
  const ageHours = Math.max(1, (Date.now() - (item.createdAt || Date.now())) / 3600000);
  const base = item.type === 'post' ? (like * 3 + comments * 2 + 1) : (comments * 2 + 1);
  return base / Math.pow(ageHours + 2, 0.6);
}

function renderCard(item, titles) {
  const a = document.createElement('a');
  a.className = 'card-item';
  const isBox = item.type === 'boxplay';
  
  a.href = isBox ? `/boxview.html?id=${item.id}` : `/post.html?id=${item.id}`;

  const w = item.writerInfo;
  const authorName = w ? escapeHtml(w.nickname || w.name) : '未知';
  const avatar = avatarUrl(w?.avatar || 'COMMON:normal_avatar');
  const titleTag = w ? renderTitleTag(w.title, titles) : '';

  let coverHtml = '';
  if (isBox && item.cover) {
    coverHtml = `<img class="card-cover" loading="lazy" decoding="async" src="/api/data/assets/${encodeURIComponent(item.cover)}" alt="">`;
  }

  const descText = isBox ? (item.description || '暂无简介') : (item.preview || '');
  const titleText = isBox ? item.title : (item.title || '无标题');

  const pinHtml = item.pinned
    ? `<span class="tag pin-tag">${SVG_PIN}置顶</span>`
    : '';

  const typeBadgeHtml = isBox && item.boxType
    ? `<span class="card-type-badge">${escapeHtml(item.boxType)}</span>`
    : '';

  const postType = !isBox && Array.isArray(item.postType) ? item.postType : [];
  const tagsHtml = postType.length
    ? `<div class="card-tags">${postType.map(t => `<span>#${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  a.innerHTML = `
    ${coverHtml}
    <div class="card-body">
      <div class="card-title">${pinHtml}${escapeHtml(titleText)}${typeBadgeHtml}</div>
      ${tagsHtml}
      <div class="card-desc">${escapeHtml(descText)}</div>
      <div class="card-author">
        <img loading="lazy" decoding="async" src="${avatar}" alt="">
        <span>${authorName}</span>${titleTag}
        <span style="margin-left:auto">${fmtTime(item.createdAt)}</span>
      </div>
    </div>
  `;
  return a;
}

async function loadFeed() {
  const grid = $('feed-grid');
  if (!grid) return;

  const seq = ++feedSeq;
  const postCats = [...selectedPostCats].join(',');
  const boxCats = [...selectedBoxCats].join(',');
  const key = `${currentTab}|${query}|${postCats}|${matchMode}|${boxCats}`;
  const cached = feedCache.get(key);
  if (cached && Date.now() - cached.at < FEED_TTL) {
    renderFeed(grid, cached.items, cached.titles);
    return;
  }

  grid.innerHTML = '<div class="feed-loading" style="grid-column:1/-1">加载中...</div>';

  try {
    const auth = !!getToken();
    const tasks = [];
    let postIndex = -1;
    let boxIndex = -1;

    if (currentTab === 'recommend' || currentTab === 'post') {
      let postUrl = `/api/works/post/feed?page=1&q=${encodeURIComponent(query)}`;
      if (postCats) postUrl += `&cats=${encodeURIComponent(postCats)}&match=${matchMode}`;
      
      postIndex = tasks.push(
        request(postUrl, { auth })
          .then(res => (res.posts || []).map(p => {
            return {
              ...p,
              postType: Array.isArray(p.type) ? p.type : (p.type ? [p.type] : []),
              type: 'post'
            };
          }))
      ) - 1;
    }

    if (currentTab === 'recommend' || currentTab === 'boxplay') {
      let boxUrl = '/api/works/boxplay/list?type=all';
      if (boxCats) boxUrl += `&cats=${encodeURIComponent(boxCats)}`;
      
      boxIndex = tasks.push(
        request(boxUrl, { auth })
          .then(res => {
            let list = (res.boxplays || []).map(b => {
              return {
                ...b,
                boxType: b.type || '其他',
                type: 'boxplay',
                commentCount: (b.comments || []).length
              };
            });
            if (query) {
              const q = query.toLowerCase();
              list = list.filter(b =>
                (b.title || '').toLowerCase().includes(q) ||
                (b.description || '').toLowerCase().includes(q)
              );
            }
            return list;
          })
      ) - 1;
    }

    const results = await Promise.all(tasks);
    if (seq !== feedSeq) return;

    const postData = postIndex >= 0 ? results[postIndex] : [];
    const boxData = boxIndex >= 0 ? results[boxIndex] : [];
    const items = [...postData, ...boxData];

    items.sort((a, b) => {
      const aPin = a.pinned ? 1 : 0;
      const bPin = b.pinned ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      if (currentTab === 'recommend') return calcScore(b) - calcScore(a);
      return b.createdAt - a.createdAt;
    });

    if (!items.length) {
      const filtered = query || selectedPostCats.size || selectedBoxCats.size;
      grid.innerHTML = `<div style="grid-column:1/-1" class="feed-empty">${filtered ? '没有找到相关内容' : '这里空空如也'}</div>`;
      return;
    }

    const ids = items.map(p => p.writerInfo?.title?.choose).filter(Boolean);
    const titles = ids.length ? await getTitles(ids) : {};
    if (seq !== feedSeq) return;

    feedCache.set(key, { at: Date.now(), items, titles });
    renderFeed(grid, items, titles);
  } catch (err) {
    if (seq !== feedSeq) return;
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1" class="feed-empty">加载失败</div>';
  }
}

function renderFeed(grid, items, titles) {
  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.appendChild(renderCard(item, titles));
  grid.innerHTML = '';
  grid.appendChild(fragment);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      if (window.__updateCatVisibility) window.__updateCatVisibility();
      loadFeed();
    });
  });

  const searchInput = $('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        query = searchInput.value.trim();
        loadFeed();
      }
    });
  }

  async function initCatFilter() {
    const info = await getTagInfo();
    if (!info.postTags.length && !info.boxplayTypes.length) return;

    const chipsPost = $('cat-chips-post');
    const chipsBox = $('cat-chips-box');
    if (!chipsPost || !chipsBox) return;

    function updateVisibility() {
      const showPost = currentTab === 'recommend' || currentTab === 'post';
      const showBox = currentTab === 'recommend' || currentTab === 'boxplay';
      const postVisible = showPost && info.postTags.length > 0;
      const boxVisible = showBox && info.boxplayTypes.length > 0;
      $('cat-group-post').hidden = !postVisible;
      $('cat-group-box').hidden = !boxVisible;
      $('cat-match').hidden = !postVisible;
      $('cat-filter').hidden = !postVisible && !boxVisible;
    }
    window.__updateCatVisibility = updateVisibility;
    updateVisibility();

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
          updateVisibility();
          loadFeed();
        });
        container.appendChild(chip);
      }
    }

    renderChips(chipsPost, info.postTags, selectedPostCats);
    renderChips(chipsBox, info.boxplayTypes, selectedBoxCats);

    $('cat-filter-toggle').addEventListener('click', () => {
      $('cat-filter').classList.toggle('collapsed');
    });

    $('cat-match').addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-match-btn');
      if (!btn || btn.classList.contains('active')) return;
      matchMode = btn.dataset.match;
      document.querySelectorAll('.cat-match-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.match === matchMode);
      });
      loadFeed();
    });
  }
  initCatFilter();

  
  const AD_INTERVAL = 5000;
  let adTimer = null;
  let adIndex = 0;
  let adCount = 0;

  async function loadAds() {
    let data;
    try {
      const res = await fetch('/api/data/ad/get');
      if (!res.ok) return;
      data = await res.json();
    } catch { return; }
    const ads = (data.ads || []).filter(a => a.image || a.text);
    if (!ads.length) return;

    const banner = $('ad-banner');
    const slides = $('ad-slides');
    const dots = $('ad-dots');
    if (!banner || !slides || !dots) return;

    slides.innerHTML = ''; dots.innerHTML = '';
    banner.hidden = false;
    adCount = ads.length;

    ads.forEach((ad, i) => {
      const slide = document.createElement('div');
      slide.className = 'ad-slide' + (i === 0 ? ' active' : '');
      if (ad.image) {
        slide.style.backgroundImage = `url('/api/data/assets/${encodeURIComponent(ad.image)}')`;
      } else {
        slide.style.background = 'linear-gradient(135deg, #2a2a2a, #0a0a0a)';
      }
      const overlay = document.createElement('div');
      overlay.className = 'ad-slide-overlay';
      slide.appendChild(overlay);

      if (ad.text) {
        const body = document.createElement('div');
        body.className = 'ad-slide-body';
        const md = document.createElement('div');
        md.className = 'markdown-body';
        if (typeof marked !== 'undefined') {
          marked.setOptions({ breaks: true, gfm: true });
          md.innerHTML = marked.parse(ad.text);
        } else {
          md.textContent = ad.text;
        }
        body.appendChild(md);
        slide.appendChild(body);
      }

      if (ad.link) {
        let url = String(ad.link).trim();
        if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
        slide.style.cursor = 'pointer';
        slide.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          window.open(url, '_blank', 'noopener');
        });
      }

      slides.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = 'ad-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', (e) => { e.stopPropagation(); goAd(i); });
      dots.appendChild(dot);
    });

    if (adCount > 1) {
      clearInterval(adTimer);
      adTimer = setInterval(() => goAd(adIndex + 1), AD_INTERVAL);
    }
  }

  function goAd(i) {
    if (!adCount) return;
    adIndex = ((i % adCount) + adCount) % adCount;
    document.querySelectorAll('.ad-slide').forEach((el, k) => el.classList.toggle('active', k === adIndex));
    document.querySelectorAll('.ad-dot').forEach((el, k) => el.classList.toggle('active', k === adIndex));
  }

  window.addEventListener('pagehide', () => clearInterval(adTimer));
  loadAds();
  loadFeed();
});