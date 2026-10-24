// @path: src/js/admin/renders/titles.js
import { $ } from '../state.js';
import { escapeHtml } from '../utils/dom.js';

let titlesCache = {};

export function getTitlesCache() { return titlesCache; }
export function setTitlesCache(obj) { titlesCache = obj; }

export function renderTitles() {
  const box = $('title-list');
  if (!box) return;
  $('title-count').textContent = Object.keys(titlesCache).length;
  box.innerHTML = '';

  if (!Object.keys(titlesCache).length) {
    box.innerHTML = '<div class="ad-empty">还没有头衔，点右上角「新建头衔」</div>';
    return;
  }

  for (const [id, t] of Object.entries(titlesCache)) {
    const item = document.createElement('div');
    item.className = 'ad-item';

    const preview = document.createElement('div');
    preview.className = 'ad-item-preview';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
    const bg = t.background || {};
    if (bg.type === 'image') {
      preview.style.backgroundImage = `url('/api/data/assets/${encodeURIComponent(bg.data)}')`;
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
    } else {
      preview.style.background = bg.data || '#000';
    }
    const span = document.createElement('span');
    span.className = 'user-title';
    span.textContent = t.name;
    span.style.marginLeft = '0';
    preview.appendChild(span);

    const info = document.createElement('div');
    info.className = 'ad-item-info';
    info.innerHTML = `
      <div class="line"><b>#${id}</b></div>
      <div class="line">name：<b>${escapeHtml(t.name)}</b></div>
      <div class="line">type：<b>${escapeHtml(bg.type || 'color')}</b></div>
      <div class="line">data：${escapeHtml(bg.data || '')}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'ad-item-actions';

    const edit = document.createElement('button');
    edit.textContent = '编辑';
    edit.dataset.titleEdit = id;

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = '删除';
    del.dataset.titleDel = id;

    actions.append(edit, del);
    item.append(preview, info, actions);
    box.appendChild(item);
  }
}