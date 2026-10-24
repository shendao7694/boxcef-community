// @path: src/js/oauth.js
import { request, getToken } from '../js/common/api.js';
import { fetchMe } from '../js/common/auth.js';

const $ = (id) => document.getElementById(id);

const SCOPE_LABELS = {
  'user:all': '获取全部用户信息',
  'user:token': '获取访问令牌',
  'user:session': '获取会话标识',
  'user:name': '获取用户名',
  'user:email': '获取邮箱',
  'user:group': '获取用户组',
  'user:ip': '获取 IP 地址'
};

const params = new URLSearchParams(location.search);
const uri = params.get('uri') || '';
const scopeRaw = params.get('scope') || '';
const appName = params.get('name') || '';
const appIcon = params.get('icon') || '/favicon.png';

let scopes = [];
let currentUser = null;

function fail(error, desc) {
  const u = new URL(uri);
  u.searchParams.set('error', error);
  u.searchParams.set('error_description', desc);
  location.replace(u.toString());
}

function showError(title, desc) {
  $('oauth-card').hidden = true;
  $('oauth-error').hidden = false;
  $('oauth-error-title').textContent = title;
  $('oauth-error-desc').textContent = desc;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function init() {
  if (!uri) {
    showError('缺少回调地址', '请求缺少 uri 参数');
    return;
  }
  try { new URL(uri); } catch {
    showError('回调地址无效', 'uri 不是合法的 URL');
    return;
  }
  if (!scopeRaw) {
    showError('缺少权限范围', '请求缺少 scope 参数');
    return;
  }
  if (!appName) {
    showError('缺少应用名称', '请求缺少 name 参数');
    return;
  }

  scopes = scopeRaw.split(',').map(s => s.trim()).filter(s => SCOPE_LABELS[s]);

  const me = await fetchMe();
  if (!me) {
    const back = location.pathname + location.search;
    location.replace(`/login.html?uri=${encodeURIComponent(back)}`);
    return;
  }
  currentUser = me;

  $('oauth-app-name').textContent = appName;
  $('oauth-icon').src = appIcon;
  $('oauth-user-name').textContent = me.nickname || me.name || '-';
  $('oauth-user-email').textContent = me.email || '-';
  $('oauth-uri').textContent = uri;

  const ul = $('oauth-scopes');
  ul.innerHTML = '';
  for (const s of scopes) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(SCOPE_LABELS[s])}</span><code>${escapeHtml(s)}</code>`;
    ul.appendChild(li);
  }

  $('oauth-card').hidden = false;
}

$('oauth-deny').addEventListener('click', () => {
  fail('canceled', '用户拒绝授权');
});

$('oauth-approve').addEventListener('click', async () => {
  const btn = $('oauth-approve');
  btn.disabled = true;
  btn.textContent = '授权中...';
  try {
    const data = await request('/api/data/oauth/userinfo', {
      method: 'POST',
      auth: true,
      body: { scope: scopes }
    });
    const u = new URL(uri);
    for (const [k, v] of Object.entries(data.user || {})) {
      u.searchParams.set(k, v);
    }
    location.replace(u.toString());
  } catch {
    btn.disabled = false;
    btn.textContent = '授权';
  }
});

init();