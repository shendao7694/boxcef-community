// @path: src/js/admin/handlers/ads.js
import { $, adminFetch } from '../state.js';
import { renderAds, getAdsCache, setAdsCache } from '../renders/ads.js';
import { showToast } from '../utils/toast.js';

export async function loadAds() {
  try {
    const data = await adminFetch('/api/admin/ad/list');
    setAdsCache(data.ads || []);
  } catch {
    setAdsCache([]);
  }
  renderAds();
}

function openAdEdit(idx) {
  const ad = getAdsCache().find(x => x.idx === idx);
  if (!ad) return;
  $('ad-index').value = ad.idx;
  $('ad-image').value = ad.image || '';
  $('ad-text').value = ad.text || '';
  $('ad-link').value = ad.link || '';
  $('ad-modal-title').textContent = '编辑广告';
  $('ad-modal').hidden = false;
}

async function moveAd(idx, direction) {
  try {
    await adminFetch('/api/admin/ad/update', {
      method: 'POST',
      body: { action: 'move', index: idx, direction }
    });
    await loadAds();
  } catch {}
}

async function deleteAd(idx) {
  if (!confirm('确认删除该广告？')) return;
  try {
    await adminFetch('/api/admin/ad/update', {
      method: 'POST',
      body: { action: 'delete', index: idx }
    });
    showToast('已删除');
    await loadAds();
  } catch {}
}

export function bindAds() {
  $('ad-add-btn').addEventListener('click', async () => {
    try {
      await adminFetch('/api/admin/ad/update', { method: 'POST', body: { action: 'add' } });
      const data = await adminFetch('/api/admin/ad/list');
      setAdsCache(data.ads || []);
      const last = getAdsCache()[getAdsCache().length - 1];
      if (last) openAdEdit(last.idx);
    } catch {}
  });

  $('ad-cancel').addEventListener('click', () => {
    $('ad-modal').hidden = true;
  });

  $('ad-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idx = Number($('ad-index').value);
    const payload = {
      action: 'update',
      index: idx,
      image: $('ad-image').value.trim(),
      text: $('ad-text').value,
      link: $('ad-link').value.trim()
    };
    const btn = $('ad-save');
    btn.disabled = true;
    btn.textContent = '保存中...';
    try {
      const res = await adminFetch('/api/admin/ad/update', { method: 'POST', body: payload });
      setAdsCache(res.ads || getAdsCache());
      renderAds();
      $('ad-modal').hidden = true;
      showToast('已保存');
    } catch {}
    btn.disabled = false;
    btn.textContent = '保存';
  });

  $('ad-list').addEventListener('click', (e) => {
    const move = e.target.closest('button[data-ad-move]');
    const edit = e.target.closest('button[data-ad-edit]');
    const del = e.target.closest('button[data-ad-del]');
    if (move) moveAd(Number(move.dataset.adMove), move.dataset.dir);
    if (edit) openAdEdit(Number(edit.dataset.adEdit));
    if (del) deleteAd(Number(del.dataset.adDel));
  });
}