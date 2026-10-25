// @path: src/js/common/nav.js
import { fetchMe, logout, avatarUrl } from './auth.js';

const USER_ICON = '<svg class="icon" viewBox="0 0 24 24"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';
const BELL_ICON = '<svg class="icon" viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm7-6V11a7 7 0 00-5.5-6.84V3a1.5 1.5 0 00-3 0v1.16A7 7 0 005 11v5l-2 2v1h18v-1l-2-2z"/></svg>';

function buildAvatar() {
  const actions = document.querySelector('.nav-actions');
  if (!actions) return null;
  if (actions.querySelector('.nav-avatar-wrap')) return null;

  const wrap = document.createElement('div');
  wrap.className = 'nav-avatar-wrap';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-avatar-btn';
  btn.setAttribute('aria-label', '账户菜单');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = USER_ICON;

  const menu = document.createElement('div');
  menu.className = 'nav-avatar-menu';
  menu.hidden = true;

  wrap.appendChild(btn);
  wrap.appendChild(menu);
  actions.appendChild(wrap);

  function close() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = menu.hidden;
    close();
    if (willOpen) {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return { wrap, btn, menu };
}

async function initBell(me) {
  const actions = document.querySelector('.nav-actions');
  if (!actions || actions.querySelector('.nav-bell')) return;
  if (!me) return;

  let unread = 0;
  try {
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/data/message/list', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      unread = data.unreadCount || 0;
    }
  } catch {}

  const a = document.createElement('a');
  a.href = '/message.html';
  a.className = 'nav-bell';
  a.setAttribute('aria-label', '消息');
  a.innerHTML = BELL_ICON + (unread > 0 ? `<span class="nav-bell-dot">${unread > 99 ? '99+' : unread}</span>` : '');

  const themeBtn = actions.querySelector('#theme-toggle');
  if (themeBtn) actions.insertBefore(a, themeBtn);
  else actions.appendChild(a);
}

async function initNav() {
  const els = buildAvatar();
  if (!els) return null;
  const { btn, menu } = els;

  const me = await fetchMe();

  if (me) {
    btn.innerHTML = '';
    const img = document.createElement('img');
    img.src = avatarUrl(me.avatar);
    img.alt = me.nickname || me.name || '';
    img.addEventListener('error', () => { btn.innerHTML = USER_ICON; });
    btn.appendChild(img);

    menu.innerHTML = `
      <div class="nav-menu-header">${escapeText(me.nickname || me.name || '')}</div>
      <a class="nav-menu-item" href="/profile.html">个人主页</a>
      <a class="nav-menu-item" href="/message.html">消息</a>
      <a class="nav-menu-item" href="/reset.html">修改密码</a>
      <a class="nav-menu-item" href="/disc.html">个人图盘</a>
      <button class="nav-menu-item nav-menu-logout" type="button">退出登录</button>
    `;
    menu.querySelector('.nav-menu-logout').addEventListener('click', () => logout());
    await initBell(me);
  } else {
    menu.innerHTML = `
      <a class="nav-menu-item" href="/login.html">登录</a>
      <a class="nav-menu-item" href="/register.html">注册</a>
    `;
  }

  return me;
}

function escapeText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

initNav();