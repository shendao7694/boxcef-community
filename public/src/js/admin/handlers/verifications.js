// @path: src/js/admin/handlers/verifications.js
import {
  $, state, adminFetch, editingVerifyKey, setEditingVerifyKey, setState
} from '../state.js';
import { renderVerifications } from '../renders/verifications.js';
import { showToast } from '../utils/toast.js';

export async function loadVerifications() {
  try {
    const data = await adminFetch('/api/admin/dashboard?section=verifications');
    setState({ ...state, verifications: data.verifications || [] });
  } catch {
    setState({ ...state, verifications: [] });
  }
  renderVerifications();
}

export function openVerifyEdit(key) {
  const v = state.verifications.find(x => x.key === key);
  if (!v) return;
  setEditingVerifyKey(key);
  $('v-key').value = v.key;
  $('v-code').value = v.code || '';
  $('v-expire').value = v.expire || '';
  $('v-ttl').value = '';
  $('verify-modal').hidden = false;
}

export async function deleteVerify(key) {
  if (!confirm('确认删除该验证码？')) return;
  try {
    await adminFetch('/api/admin/verification/update', { method: 'POST', body: { key, action: 'delete' } });
    showToast('已删除');
    await window.__reloadAll();
  } catch {}
}

export function bindVerifications() {
  $('v-cancel').addEventListener('click', () => {
    $('verify-modal').hidden = true;
    setEditingVerifyKey(null);
  });
  $('verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingVerifyKey) return;
    const body = { key: editingVerifyKey, action: 'update' };
    const code = $('v-code').value.trim();
    const expire = $('v-expire').value.trim();
    const ttl = $('v-ttl').value.trim();
    if (code) body.code = code;
    if (expire) body.expire = Number(expire);
    if (ttl) body.ttl = Number(ttl);
    const btn = $('v-save');
    btn.disabled = true;
    btn.textContent = '保存中...';
    try {
      await adminFetch('/api/admin/verification/update', { method: 'POST', body });
      showToast('已保存');
      $('verify-modal').hidden = true;
      setEditingVerifyKey(null);
      await window.__reloadAll();
    } catch {}
    btn.disabled = false;
    btn.textContent = '保存';
  });

  $('verifications-table').querySelector('tbody').addEventListener('click', (e) => {
    const edit = e.target.closest('button[data-edit-v]');
    const del = e.target.closest('button[data-del-v]');
    if (edit) openVerifyEdit(edit.dataset.editV);
    if (del) deleteVerify(del.dataset.delV);
  });
}