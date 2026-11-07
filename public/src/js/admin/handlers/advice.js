// @path: src/js/admin/handlers/advice.js
import { $, state, adminFetch, setState } from '../state.js';
import { renderAdvice } from '../renders/advice.js';
import { showToast } from '../utils/toast.js';
import { confirm } from '../../common/dialog.js';
import { t } from '../../common/i18n.js';

let page = 1;
let pageSize = 10;
let status = '';
let total = 0;

function updatePager() {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  $('advice-page-info').textContent = `${page} / ${pages}`;
  $('advice-page-prev').disabled = page <= 1;
  $('advice-page-next').disabled = page >= pages;
}

export async function loadAdvice(reset = false) {
  if (reset) page = 1;
  try {
    const url = `/api/admin/advice/list?page=${page}&pageSize=${pageSize}&status=${encodeURIComponent(status)}`;
    const data = await adminFetch(url);
    setState({ ...state, advice: data.advice || [] });
    total = Number(data.total) || (data.advice || []).length;
  } catch {
    setState({ ...state, advice: [] });
    total = 0;
  }
  renderAdvice(total);
  updatePager();
}

export async function handleAdviceAction(index, action) {
  if (action === 'delete') {
    const ok = await confirm(t('确认删除该建议？'), { danger: true });
    if (!ok) return;
  }
  try {
    await adminFetch('/api/admin/advice/action', {
      method: 'POST',
      body: { index, action }
    });
    showToast(t('已操作'));
    await loadAdvice(false);
    if (!state.advice.length && page > 1) {
      page -= 1;
      await loadAdvice(false);
    }
  } catch {}
}

function openReplyAdvice(index) {
  $('reply-target-type').value = 'advice';
  $('reply-target-id').value = String(index);
  $('reply-modal-title').textContent = t('回复建议提交者');
  $('reply-text').value = '';
  $('reply-modal').hidden = false;
}

export function bindAdvice() {
  $('advice-table').querySelector('tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-adv]');
    const reply = e.target.closest('button[data-adv-reply]');
    if (reply && !reply.disabled) {
      openReplyAdvice(Number(reply.dataset.advReply));
      return;
    }
    if (!btn) return;
    handleAdviceAction(Number(btn.dataset.adv), btn.dataset.act);
  });

  $('advice-filter').addEventListener('change', () => {
    status = $('advice-filter').value;
    loadAdvice(true);
  });

  $('advice-page-size').addEventListener('change', () => {
    pageSize = Number($('advice-page-size').value) || 10;
    loadAdvice(true);
  });
  $('advice-page-prev').addEventListener('click', () => {
    if (page <= 1) return;
    page -= 1;
    loadAdvice(false);
  });
  $('advice-page-next').addEventListener('click', () => {
    page += 1;
    loadAdvice(false);
  });
}
