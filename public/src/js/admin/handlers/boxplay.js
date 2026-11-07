// @path: src/js/admin/handlers/boxplay.js
import { $, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';
import { renderBoxplayList } from '../renders/boxplay.js';
import { getTagInfo, ensureTagInfo } from './tags.js';
import { confirm } from '../../common/dialog.js';
import { t } from '../../common/i18n.js';

let boxplayItems = [];
let page = 1;
let pageSize = 10;
let query = '';
let status = '';
let cat = '';
let total = 0;
let searchTimer = null;

function updatePager() {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  $('bp-page-info').textContent = `${page} / ${pages}`;
  $('bp-page-prev').disabled = page <= 1;
  $('bp-page-next').disabled = page >= pages;
}

export async function loadBoxplayList(reset = false) {
  await ensureTagInfo();
  if (reset) page = 1;
  try {
    const url = `/api/admin/boxplay/list?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&cat=${encodeURIComponent(cat)}`;
    const data = await adminFetch(url);
    boxplayItems = data.boxplays || [];
    total = Number(data.total) || boxplayItems.length;
  } catch (err) {
    console.error('加载作品列表失败', err);
    boxplayItems = [];
    total = 0;
  }
  renderBoxplayList(boxplayItems, total);
  updatePager();
}

function openReplyBoxplay(id) {
  $('reply-target-type').value = 'boxplay';
  $('reply-target-id').value = id;
  $('reply-modal-title').textContent = t('回复作品作者');
  $('reply-text').value = '';
  $('reply-modal').hidden = false;
}

function openBpEdit(id) {
  const item = boxplayItems.find(b => b.id === id);
  if (!item) return;
  $('bpt-id').value = id;
  $('bpt-name').textContent = item.title || id;
  $('bpt-title').value = item.title || '';
  $('bpt-desc').value = item.description || '';
  $('bpt-url').value = item.playurl || '';
  $('bpt-iframe').value = item.isInIframe ? '1' : '0';

  const box = $('bpt-list');
  box.innerHTML = '';
  const current = item.type || '其他';
  for (const type of getTagInfo().boxplayTypes) {
    const label = document.createElement('label');
    label.className = 'bpt-row';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'bpt-type';
    radio.value = type;
    if (type === current) radio.checked = true;
    const span = document.createElement('span');
    span.textContent = type;
    label.append(radio, span);
    box.appendChild(label);
  }
  $('bp-edit-modal').hidden = false;
}

export function bindBoxplay() {
  const search = $('bp-search');
  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        query = search.value.trim();
        loadBoxplayList(true);
      }, 300);
    });
  }

  $('bp-status-filter').addEventListener('change', () => {
    status = $('bp-status-filter').value;
    loadBoxplayList(true);
  });

  $('bp-cat-filter').addEventListener('change', () => {
    cat = $('bp-cat-filter').value;
    loadBoxplayList(true);
  });

  $('bp-page-size').addEventListener('change', () => {
    pageSize = Number($('bp-page-size').value) || 10;
    loadBoxplayList(true);
  });
  $('bp-page-prev').addEventListener('click', () => {
    if (page <= 1) return;
    page -= 1;
    loadBoxplayList(false);
  });
  $('bp-page-next').addEventListener('click', () => {
    page += 1;
    loadBoxplayList(false);
  });

  $('bpt-cancel').addEventListener('click', () => {
    $('bp-edit-modal').hidden = true;
  });

  $('bpt-save').addEventListener('click', async () => {
    const id = $('bpt-id').value;
    const checked = document.querySelector('input[name="bpt-type"]:checked');
    const title = $('bpt-title').value.trim();
    const playurl = $('bpt-url').value.trim();
    if (!id) return;
    if (!title) { showToast(t('请填写作品名称'), 'error'); return; }
    if (!playurl) { showToast(t('请填写游玩链接'), 'error'); return; }

    const btn = $('bpt-save');
    btn.disabled = true;
    btn.textContent = t('保存中...');
    try {
      await adminFetch('/api/admin/boxplay/edit', {
        method: 'POST',
        body: {
          id,
          title,
          description: $('bpt-desc').value,
          playurl,
          type: checked ? checked.value : undefined,
          isInIframe: $('bpt-iframe').value === '1'
        }
      });
      showToast(t('已保存'));
      $('bp-edit-modal').hidden = true;
      await loadBoxplayList(false);
    } catch {}
    btn.disabled = false;
    btn.textContent = t('保存');
  });

  $('boxplay-table').querySelector('tbody').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('button[data-bp-edit]');
    const reply = e.target.closest('button[data-bp-reply]');
    const btn = e.target.closest('button[data-bp-id]');
    if (editBtn) {
      openBpEdit(editBtn.dataset.bpEdit);
      return;
    }
    if (reply && !reply.disabled) {
      openReplyBoxplay(reply.dataset.bpReply);
      return;
    }
    if (!btn || btn.disabled) return;
    const id = btn.dataset.bpId;
    const act = btn.dataset.bpAct;

    if (act === 'delete') {
      const ok = await confirm(t('确认彻底删除该作品？该操作不可恢复。'), { danger: true });
      if (!ok) return;
    }

    try {
      await adminFetch('/api/admin/boxplay/audit', {
        method: 'POST',
        body: { id, action: act }
      });
      showToast(t('已操作'));
      await loadBoxplayList(false);
      if (!boxplayItems.length && page > 1) {
        page -= 1;
        await loadBoxplayList(false);
      }
    } catch {}
  });
}
