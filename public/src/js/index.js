// @path: src/js/index.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { avatarUrl } from '../js/common/auth.js';
import { getTitles, renderTitleTag } from '../js/common/title.js';

const $ = (id) => document.getElementById(id);

const SVG_PIN = '<svg viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;vertical-align:middle;margin-right:2px;"><path d="M14.5 3.5l6 6-3.5 1.2-3.7 3.7 1.2 5.1-1.4 1.4-4.6-4.6-5.8 5.8-1.4-1.4 5.8-5.8-4.6-4.6L3.9 9.3l5.1 1.2L12.7 7 14.5 3.5z"/></svg>';

let currentTab = 'recommend';
let query = '';
let allData = [];

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
    coverHtml = `<img class="card-cover" src="/api/data/assets/${encodeURIComponent(item.cover)}" alt="">`;
  }

  const descText = isBox ? (item.description || '暂无简介') : (item.preview || '');
  const titleText = isBox ? item.title : (item.title || '无标题');

  
  const pinHtml = item.pinned 
    ? `<span class="tag pin-tag">${SVG_PIN}置顶</span>` 
    : '';

  a.innerHTML = `
    ${coverHtml}
    <div class="card-body">
      <div class="card-title">${pinHtml}${escapeHtml(titleText)}</div>
      <div class="card-desc">${escapeHtml(descText)}</div>
      <div class="card-author">
        <img src="${avatar}" alt="">
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

  grid.innerHTML = '<div class="feed-loading" style="grid-column:1/-1">加载中...</div>';

  try {
    let postData = [], boxData = [];

    if (currentTab === 'recommend' || currentTab === 'post') {
      const res = await request(`/api/works/post/feed?page=1&q=${encodeURIComponent(query)}`, { auth: !!getToken() });
      postData = (res.posts || []).map(p => ({ ...p, type: 'post' }));
    }
    
    if (currentTab === 'recommend' || currentTab === 'boxplay') {
      const res = await request(`/api/works/boxplay/list?type=all`, { auth: !!getToken() });
      let bList = (res.boxplays || []).map(b => ({ ...b, type: 'boxplay', commentCount: (b.comments || []).length }));
      if (query) {
        const q = query.toLowerCase();
        bList = bList.filter(b => 
          (b.title || '').toLowerCase().includes(q) || 
          (b.description || '').toLowerCase().includes(q)
        );
      }
      boxData = bList;
    }

    allData = [...postData, ...boxData];
    
    
    allData.sort((a, b) => {
      
      const aPin = a.pinned ? 1 : 0;
      const bPin = b.pinned ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;

      
      if (currentTab === 'recommend') {
        return calcScore(b) - calcScore(a);
      } else {
        return b.createdAt - a.createdAt;
      }
    });

    if (!allData.length) {
      grid.innerHTML = `<div style="grid-column:1/-1" class="feed-empty">${query ? '没有找到相关内容' : '这里空空如也'}</div>`;
      return;
    }

    const ids = allData.map(p => p.writerInfo?.title?.choose).filter(Boolean);
    const titles = ids.length ? await getTitles(ids) : {};

    grid.innerHTML = '';
    for (const item of allData) {
      grid.appendChild(renderCard(item, titles));
    }

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1" class="feed-empty">加载失败</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
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

  loadAds();
  loadFeed();
});