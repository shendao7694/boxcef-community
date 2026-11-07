// @path: src/js/index.js
import { request, getToken } from '../js/common/api.js';
import { getTitles, renderTitleTag } from '../js/common/title.js';
import { avatarUrl } from '../js/common/auth.js';
import { t } from '../js/common/i18n.js';

const $ = (id) => document.getElementById(id);

const SVG_PIN = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;vertical-align:middle;margin-right:2px;"><path d="M14.5 3.5l6 6-3.5 1.2-3.7 3.7 1.2 5.1-1.4 1.4-4.6-4.6-5.8 5.8-1.4-1.4 5.8-5.8-4.6-4.6L3.9 9.3l5.1 1.2L12.7 7 14.5 3.5z"/></svg>';

let feedSeq = 0;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtTime(time) {
  if (!time) return '';
  const diff = Date.now() - time;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return t('刚刚');
  if (diff < hour) return `${Math.floor(diff / min)} ${t('分钟前')}`;
  if (diff < day) return `${Math.floor(diff / hour)} ${t('小时前')}`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} ${t('天前')}`;
  return new Date(time).toLocaleDateString();
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
  a.setAttribute('data-no-i18n', '');

  const w = item.writerInfo;
  const authorName = w ? escapeHtml(w.nickname || w.name) : t('未知');
  const avatar = avatarUrl(w?.avatar || 'COMMON:normal_avatar');
  const titleTag = w ? renderTitleTag(w.title, titles) : '';

  const coverHtml = isBox && item.cover
    ? `<img class="card-cover" loading="lazy" decoding="async" src="/api/data/assets/${encodeURIComponent(item.cover)}" alt="">`
    : '';

  const descText = isBox ? (item.description || t('暂无简介')) : (item.preview || '');
  const titleText = isBox ? item.title : (item.title || t('无标题'));

  const pinHtml = item.pinned ? `<span class="tag pin-tag">${SVG_PIN}${t('置顶')}</span>` : '';
  const typeBadgeHtml = isBox && item.boxType
    ? `<span class="card-type-badge">${escapeHtml(item.boxType)}</span>`
    : '';

  const postType = !isBox && Array.isArray(item.postType) ? item.postType : [];
  const tagsHtml = postType.length
    ? `<div class="card-tags">${postType.map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>`
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
  grid.innerHTML = `<div class="feed-loading" style="grid-column:1/-1">${t('加载中...')}</div>`;

  try {
    const auth = !!getToken();
    const [postRes, boxRes] = await Promise.all([
      request('/api/works/post/feed?page=1', { auth }).catch(() => ({ posts: [] })),
      request('/api/works/boxplay/list?type=all', { auth }).catch(() => ({ boxplays: [] }))
    ]);
    if (seq !== feedSeq) return;

    const posts = (postRes.posts || []).map(post => ({
      ...post,
      postType: Array.isArray(post.type) ? post.type : (post.type ? [post.type] : []),
      type: 'post'
    }));

    const boxplays = (boxRes.boxplays || []).map(box => ({
      ...box,
      boxType: box.type || '其他',
      type: 'boxplay',
      commentCount: (box.comments || []).length
    }));

    const items = [...posts, ...boxplays].sort((a, b) => {
      const aPin = a.pinned ? 1 : 0;
      const bPin = b.pinned ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return calcScore(b) - calcScore(a);
    });

    if (!items.length) {
      grid.innerHTML = `<div style="grid-column:1/-1" class="feed-empty">${t('这里空空如也')}</div>`;
      return;
    }

    const ids = items.map(item => item.writerInfo?.title?.choose).filter(Boolean);
    const titles = ids.length ? await getTitles(ids) : {};
    if (seq !== feedSeq) return;

    const fragment = document.createDocumentFragment();
    for (const item of items) fragment.appendChild(renderCard(item, titles));
    grid.innerHTML = '';
    grid.appendChild(fragment);
  } catch (err) {
    if (seq !== feedSeq) return;
    grid.innerHTML = `<div style="grid-column:1/-1" class="feed-empty">${t('加载失败')}</div>`;
  }
}

function goSearch(keyword) {
  const content = String(keyword || '').trim();
  location.href = `/search.html?content=${encodeURIComponent(content)}`;
}

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
  const ads = (data.ads || []).filter(ad => ad.image || ad.text);
  if (!ads.length) return;

  const banner = $('ad-banner');
  const slides = $('ad-slides');
  const dots = $('ad-dots');
  if (!banner || !slides || !dots) return;

  slides.innerHTML = '';
  dots.innerHTML = '';
  banner.hidden = false;
  adCount = ads.length;

  ads.forEach((ad, i) => {
    const slide = document.createElement('div');
    slide.className = 'ad-slide' + (i === 0 ? ' active' : '');
    slide.setAttribute('data-no-i18n', '');
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

document.addEventListener('DOMContentLoaded', () => {
  const form = $('home-search-form');
  const input = $('home-search-input');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      goSearch(input ? input.value : '');
    });
  }

  window.addEventListener('pagehide', () => clearInterval(adTimer));
  loadAds();
  loadFeed();
});
