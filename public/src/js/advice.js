// @path: src/js/advice.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe } from '../js/common/auth.js';

const $ = (id) => document.getElementById(id);

const COOLDOWN_KEY = 'adviceCooldownUntil';
let cooldownTimer = null;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const STATUS_LABELS = {
  pending: '待处理',
  accepted: '已接受',
  rejected: '已拒绝'
};

function fmtTime(t) {
  if (!t) return '-';
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
}

function startCooldown(seconds) {
  const until = Date.now() + seconds * 1000;
  localStorage.setItem(COOLDOWN_KEY, String(until));
  applyCooldown();
}

function applyCooldown() {
  const btn = $('advice-submit');
  if (!btn) return;
  if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }

  const until = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
  const remain = Math.ceil((until - Date.now()) / 1000);
  if (remain <= 0) {
    localStorage.removeItem(COOLDOWN_KEY);
    btn.disabled = false;
    btn.textContent = '提交建议';
    return;
  }

  btn.disabled = true;
  btn.textContent = `${remain}s 后可再次提交`;
  cooldownTimer = setInterval(() => {
    const left = Math.ceil((until - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
      localStorage.removeItem(COOLDOWN_KEY);
      btn.disabled = false;
      btn.textContent = '提交建议';
    } else {
      btn.textContent = `${left}s 后可再次提交`;
    }
  }, 500);
}

async function loadMine() {
  const box = $('advice-list');
  box.innerHTML = '<div class="empty-text">加载中...</div>';
  try {
    const data = await request('/api/data/advice/list', { auth: true });
    const list = data.advice || [];
    if (!list.length) {
      box.innerHTML = '<div class="empty-text">还没有提交过建议</div>';
      return;
    }
    box.innerHTML = '';
    for (const a of list) {
      const item = document.createElement('div');
      item.className = 'advice-item status-' + a.status;
      item.innerHTML = `
        <div class="advice-item-head">
          <span class="advice-status">${STATUS_LABELS[a.status] || a.status}</span>
          <span class="advice-time">${fmtTime(a.createdAt)}</span>
        </div>
        <div class="advice-item-body">${escapeHtml(a.content)}</div>
        <div class="advice-item-actions">
          <button class="danger" data-del="${a.idx}">删除</button>
        </div>
      `;
      item.querySelector('button[data-del]').addEventListener('click', () => deleteMine(a.idx));
      box.appendChild(item);
    }
  } catch {
    box.innerHTML = '<div class="empty-text">加载失败</div>';
  }
}

async function deleteMine(index) {
  if (!confirm('确认删除这条建议？')) return;
  try {
    await request('/api/data/advice/delete', {
      method: 'POST', auth: true, body: { index }
    });
    showToast('已删除');
    await loadMine();
  } catch {}
}

$('advice-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = $('advice-content').value.trim();
  if (!content) { showToast('内容不能为空', 'error'); return; }

  const btn = $('advice-submit');
  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = '提交中...';
  try {
    await request('/api/data/advice/create', {
      method: 'POST', auth: true, body: { content }
    });
    $('advice-content').value = '';
    showToast('已提交，感谢你的建议');
    startCooldown(60);
    await loadMine();
  } catch (err) {
    const msg = String(err && err.message || '');
    if (msg.includes('60')) {
      startCooldown(60);
    } else {
      btn.disabled = false;
      btn.textContent = '提交建议';
    }
  }
});

(async () => {
  if (!getToken()) { location.href = '/login.html'; return; }
  const me = await fetchMe();
  if (!me) { location.href = '/login.html'; return; }
  applyCooldown();
  await loadMine();
})();