// @path: src/js/admin/handlers/boxplay.js
import { $, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';
import { renderBoxplayList } from '../renders/boxplay.js';
import { getTagInfo, ensureTagInfo } from './tags.js';

let boxplayItems = [];

function filterBoxplay() {
  const cat = $('bp-cat-filter')?.value || '';
  return cat ? boxplayItems.filter(b => (b.type || '其他') === cat) : boxplayItems;
}

export async function loadBoxplayList() {
  await ensureTagInfo();
  try {
    const data = await adminFetch('/api/admin/boxplay/list');
    boxplayItems = data.boxplays || [];
  } catch (err) {
    console.error('加载作品列表失败', err);
    boxplayItems = [];
  }
  renderBoxplayList(filterBoxplay());
}

function openReplyBoxplay(id) {
  $('reply-target-type').value = 'boxplay';
  $('reply-target-id').value = id;
  $('reply-modal-title').textContent = '回复作品作者';
  $('reply-text').value = '';
  $('reply-modal').hidden = false;
}

function openBpType(id) {
  const item = boxplayItems.find(b => b.id === id);
  if (!item) return;
  $('bpt-id').value = id;
  $('bpt-name').textContent = item.title || id;

  const box = $('bpt-list');
  box.innerHTML = '';
  const current = item.type || '其他';
  for (const t of getTagInfo().boxplayTypes) {
    const label = document.createElement('label');
    label.className = 'bpt-row';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'bpt-type';
    radio.value = t;
    if (t === current) radio.checked = true;
    const span = document.createElement('span');
    span.textContent = t;
    label.append(radio, span);
    box.appendChild(label);
  }
  $('bp-type-modal').hidden = false;
}

export function bindBoxplay() {
  $('bp-cat-filter').addEventListener('change', () => renderBoxplayList(filterBoxplay()));

  $('bpt-cancel').addEventListener('click', () => {
    $('bp-type-modal').hidden = true;
  });

  $('bpt-save').addEventListener('click', async () => {
    const id = $('bpt-id').value;
    const checked = document.querySelector('input[name="bpt-type"]:checked');
    if (!id || !checked) return;
    const btn = $('bpt-save');
    btn.disabled = true;
    btn.textContent = '保存中...';
    try {
      await adminFetch('/api/admin/boxplay/edit', {
        method: 'POST',
        body: { id, type: checked.value }
      });
      showToast('已保存');
      $('bp-type-modal').hidden = true;
      await loadBoxplayList();
    } catch {}
    btn.disabled = false;
    btn.textContent = '保存';
  });

  $('boxplay-table').querySelector('tbody').addEventListener('click', async (e) => {
    const typeBtn = e.target.closest('button[data-bp-type]');
    const btn = e.target.closest('button[data-bp-id]');
    const reply = e.target.closest('button[data-bp-reply]');
    if (typeBtn) {
      openBpType(typeBtn.dataset.bpType);
      return;
    }
    if (reply && !reply.disabled) {
      openReplyBoxplay(reply.dataset.bpReply);
      return;
    }
    if (!btn || btn.disabled) return;
    const id = btn.dataset.bpId;
    const act = btn.dataset.bpAct;

    if (act === 'delete' && !confirm('确认彻底删除该作品？该操作不可恢复。')) return;

    try {
      await adminFetch('/api/admin/boxplay/audit', {
        method: 'POST',
        body: { id, action: act }
      });
      showToast('已操作');
      await loadBoxplayList();
    } catch {}
  });
}
