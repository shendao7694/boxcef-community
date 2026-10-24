// @path: src/js/admin/handlers/advice.js
import { $, state, adminFetch, setState } from '../state.js';
import { renderAdvice } from '../renders/advice.js';
import { showToast } from '../utils/toast.js';

export async function handleAdviceAction(index, action) {
  if (action === 'delete' && !confirm('确认删除该建议？')) return;
  try {
    await adminFetch('/api/admin/advice/action', {
      method: 'POST',
      body: { index, action }
    });
    showToast('已操作');
    const adviceData = await adminFetch('/api/admin/advice/list');
    setState({ ...state, advice: adviceData.advice || [] });
    renderAdvice();
  } catch {}
}

export function bindAdvice() {
  $('advice-table').querySelector('tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-adv]');
    if (!btn) return;
    handleAdviceAction(Number(btn.dataset.adv), btn.dataset.act);
  });

  $('advice-filter').addEventListener('change', renderAdvice);
}