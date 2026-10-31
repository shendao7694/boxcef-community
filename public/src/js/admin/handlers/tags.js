// @path: src/js/admin/handlers/tags.js
import { $, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';

let tagInfo = { postTags: [], boxplayTypes: [] };
let tagInfoLoaded = false;

async function fetchTagInfo() {
  try {
    const res = await fetch('/api/data/tag/list');
    const data = await res.json();
    tagInfo = {
      postTags: Array.isArray(data.postTags) ? data.postTags : [],
      boxplayTypes: Array.isArray(data.boxplayTypes) ? data.boxplayTypes : []
    };
    tagInfoLoaded = true;
  } catch {}
  return tagInfo;
}

export function getTagInfo() {
  return tagInfo;
}

export async function ensureTagInfo() {
  if (!tagInfoLoaded) {
    await fetchTagInfo();
    fillCatFilters();
  }
  return tagInfo;
}

export function fillCatFilters() {
  const postSel = $('post-cat-filter');
  if (postSel) {
    const cur = postSel.value;
    postSel.innerHTML = '<option value="">全部分类</option>';
    for (const t of tagInfo.postTags) {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      postSel.appendChild(opt);
    }
    if ([...postSel.options].some(o => o.value === cur)) postSel.value = cur;
  }

  const bpSel = $('bp-cat-filter');
  if (bpSel) {
    const cur = bpSel.value;
    bpSel.innerHTML = '<option value="">全部分类</option>';
    for (const t of tagInfo.boxplayTypes) {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      bpSel.appendChild(opt);
    }
    if ([...bpSel.options].some(o => o.value === cur)) bpSel.value = cur;
  }
}

async function reloadTagData() {
  await fetchTagInfo();
  fillCatFilters();
  await loadTagDict();
}

export async function loadTagDict() {
  await ensureTagInfo();
  try {
    const data = await adminFetch('/api/admin/tag/list');
    renderTagDict(data.fixed || [], data.custom || []);
  } catch {}
}

function renderBpTypesReadonly() {
  const box = $('bp-type-readonly');
  if (!box) return;
  box.innerHTML = '';
  for (const t of tagInfo.boxplayTypes) {
    const span = document.createElement('span');
    span.className = 'tag-dict-item tag-dict-fixed';
    span.textContent = t;
    box.appendChild(span);
  }
}

function renderTagDict(fixed, custom) {
  renderBpTypesReadonly();
  const box = $('tag-dict-list');
  if (!box) return;
  box.innerHTML = '';
  for (const t of fixed) {
    const span = document.createElement('span');
    span.className = 'tag-dict-item tag-dict-fixed';
    span.textContent = t;
    box.appendChild(span);
  }
  for (const t of custom) {
    const span = document.createElement('span');
    span.className = 'tag-dict-item';
    span.textContent = t;
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '×';
    del.title = '删除';
    del.addEventListener('click', async () => {
      if (!confirm(`删除自定义标签「${t}」？已有帖子仍会保留该标签显示`)) return;
      try {
        await adminFetch('/api/admin/tag/update', { method: 'POST', body: { action: 'remove', tag: t } });
        showToast('已删除');
        await reloadTagData();
      } catch {}
    });
    span.appendChild(del);
    box.appendChild(span);
  }
}

export function bindTagDict() {
  const btn = $('tag-dict-add-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const input = $('tag-dict-input');
    const tag = (input.value || '').trim();
    if (!tag) { showToast('请输入标签名', 'error'); return; }
    try {
      await adminFetch('/api/admin/tag/update', { method: 'POST', body: { action: 'add', tag } });
      showToast('已添加');
      input.value = '';
      await reloadTagData();
    } catch {}
  });
}
