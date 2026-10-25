// @path: src/js/message.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { avatarUrl } from '../js/common/auth.js';

const $ = (id) => document.getElementById(id);

const TYPE_LABELS = {
  0: '你的帖子被评论',
  1: '你的帖子被点赞',
  2: '你的作品被拒绝',
  3: '你的作品已通过',
  4: '你的评论被回复',
  5: '你的评论被点赞',
  6: '有人关注了你',
  7: '有人取消关注了你',
  8: '你的建议被采纳',
  9: '你的建议被拒绝'
};

let messages = [];

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function fmtTime(t) {
  if (!t) return '-';
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
}

function detailLink(m) {
  const d = m.data || {};
  // 帖子/作品的评论、点赞
  if ([0, 1, 4, 5].includes(m.type) && d.postId) {
    return d.target === 'boxplay' ? `/boxview.html?id=${d.postId}` : `/post.html?id=${d.postId}`;
  }
  // 作品审核
  if ([2, 3].includes(m.type) && d.boxplayId) return `/boxview.html?id=${d.boxplayId}`;
  // 建议处理
  if ([8, 9].includes(m.type)) return '/advice.html';
  // 关注/取消关注 -> 前往对方主页
  if ([6, 7].includes(m.type) && d.from) {
    return `/user.html?id=${d.from}`;
  }
  return '';
}

function renderList() {
  const box = $('message-list');
  box.innerHTML = '';
  if (!messages.length) {
    box.innerHTML = '<div class="empty-text">还没有消息</div>';
    return;
  }
  messages.forEach((m, idx) => {
    const d = m.data || {};
    const item = document.createElement('div');
    // 如果未读，加上 unread 类用于样式控制
    item.className = 'message-item' + (!m.read ? ' unread' : '');
    
    const preview = (d.text || '').slice(0, 10);
    const avatar = d.from ? avatarUrl(d.fromAvatar) : '';
    const who = d.from ? escapeHtml(d.fromName || '某用户') : '管理员';
    
    item.innerHTML = `
      <div class="message-item-head">
        ${avatar ? `<img src="${avatar}" alt="">` : ''}
        <div class="message-item-title">
          <b>${TYPE_LABELS[m.type] || '消息'}</b>
          <span class="message-time">${fmtTime(d.createdAt)}</span>
        </div>
      </div>
      <div class="message-item-body">
        <span class="message-who">${who}</span>
        ${preview ? `<span class="message-preview">${escapeHtml(preview)}${(d.text || '').length > 10 ? '…' : ''}</span>` : ''}
      </div>
      ${!m.read ? '<span class="message-unread-dot"></span>' : ''}
    `;
    item.addEventListener('click', () => openDetail(idx));
    box.appendChild(item);
  });
}

function openDetail(idx) {
  const m = messages[idx];
  if (!m) return;

  // 纯前端即时消除未读红点
  if (!m.read) {
    m.read = true;
    renderList();
  }

  const d = m.data || {};
  $('detail-title').textContent = TYPE_LABELS[m.type] || '消息详情';
  const rows = [];
  if (d.from) {
    rows.push(`<div class="detail-row"><span>来自</span><b>${escapeHtml(d.fromName || '某用户')}</b></div>`);
  } else {
    rows.push(`<div class="detail-row"><span>来自</span><b>管理员</b></div>`);
  }
  rows.push(`<div class="detail-row"><span>时间</span><b>${fmtTime(d.createdAt)}</b></div>`);
  
  if (d.text) {
    rows.push(`<div class="detail-text">${escapeHtml(d.text)}</div>`);
  }
  
  $('detail-body').innerHTML = rows.join('');

  // 处理底部按钮（前往查看）
  const link = detailLink(m);
  const a = $('detail-link');
  if (link) { 
    a.href = link; 
    a.hidden = false; 
    // 如果是关注/取消关注，调整文案（可选）
    a.textContent = [6, 7].includes(m.type) ? '前往对方主页' : '前往查看';
  } else { 
    a.hidden = true; 
  }
  
  $('detail-modal').hidden = false;
}

async function markAllRead() {
  try { await request('/api/data/message/read', { method: 'POST', auth: true }); } catch {}
}

async function load() {
  if (!getToken()) { location.href = '/login.html'; return; }
  let data;
  try {
    data = await request('/api/data/message/list', { auth: true });
  } catch {
    $('message-list').innerHTML = '<div class="empty-text">加载失败</div>';
    return;
  }
  messages = data.messages || [];
  renderList();
  await markAllRead();
}

$('detail-close').addEventListener('click', () => { $('detail-modal').hidden = true; });

$('delete-all-btn').addEventListener('click', async () => {
  if (!confirm('确认删除全部消息？此操作不可恢复。')) return;
  try {
    await request('/api/data/message/delete', { method: 'POST', auth: true });
    messages = [];
    renderList();
    showToast('已删除全部消息');
  } catch {}
});

load();