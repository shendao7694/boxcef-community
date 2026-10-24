// @path: src/js/admin/renders/ads.js
import { $ } from '../state.js';
import { escapeHtml } from '../utils/dom.js';

let adsCache = [];

export function getAdsCache() { return adsCache; }
export function setAdsCache(list) { adsCache = list; }

export function renderAds() {
  const box = $('ad-list');
  if (!box) return;
  $('ad-count').textContent = adsCache.length;
  box.innerHTML = '';

  if (!adsCache.length) {
    box.innerHTML = '<div class="ad-empty">还没有广告，点右上角「添加广告」</div>';
    return;
  }

  adsCache.forEach((ad) => {
    const item = document.createElement('div');
    item.className = 'ad-item';

    const preview = document.createElement('div');
    preview.className = 'ad-item-preview';
    if (ad.image) {
      preview.style.backgroundImage = `url('/api/data/assets/${encodeURIComponent(ad.image)}')`;
    } else {
      preview.style.background = 'linear-gradient(135deg, #2a2a2a, #0a0a0a)';
    }
    const md = document.createElement('div');
    md.className = 'md';
    md.textContent = ad.text || '';
    preview.appendChild(md);

    const info = document.createElement('div');
    info.className = 'ad-item-info';
    info.innerHTML = `
      <div class="line"><b>#${ad.idx}</b></div>
      <div class="line">image：<b>${escapeHtml(ad.image || '（无）')}</b></div>
      <div class="line">link：<b>${escapeHtml(ad.link || '（无）')}</b></div>
      <div class="line">text：${escapeHtml((ad.text || '').slice(0, 80))}${(ad.text || '').length > 80 ? '…' : ''}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'ad-item-actions';

    const up = document.createElement('button');
    up.textContent = '上移';
    up.dataset.adMove = ad.idx;
    up.dataset.dir = 'up';

    const down = document.createElement('button');
    down.textContent = '下移';
    down.dataset.adMove = ad.idx;
    down.dataset.dir = 'down';

    const edit = document.createElement('button');
    edit.textContent = '编辑';
    edit.dataset.adEdit = ad.idx;

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = '删除';
    del.dataset.adDel = ad.idx;

    actions.append(up, down, edit, del);
    item.append(preview, info, actions);
    box.appendChild(item);
  });
}