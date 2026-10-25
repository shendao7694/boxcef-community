// @path: src/js/admin/handlers/boxplay.js
import { $, adminFetch } from '../state.js';
import { showToast } from '../utils/toast.js';
import { renderBoxplayList } from '../renders/boxplay.js';

export async function loadBoxplayList() {
  try {
    const data = await adminFetch('/api/admin/boxplay/list');
    renderBoxplayList(data.boxplays || []);
  } catch (err) {
    console.error('加载作品列表失败', err);
  }
}

function openReplyBoxplay(id) {
  $('reply-target-type').value = 'boxplay';
  $('reply-target-id').value = id;
  $('reply-modal-title').textContent = '回复作品作者';
  $('reply-text').value = '';
  $('reply-modal').hidden = false;
}

export function bindBoxplay() {
  $('boxplay-table').querySelector('tbody').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-bp-id]');
    const reply = e.target.closest('button[data-bp-reply]');
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