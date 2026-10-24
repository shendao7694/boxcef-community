// @path: src/js/reset.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe } from '../js/common/auth.js';

const $ = (id) => document.getElementById(id);
let countdown = 0;
let timer = null;
let needVerify = true;

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return null;
    const data = await res.json();
    return data.settings || null;
  } catch {
    return null;
  }
}

function redirectTarget() {
  const params = new URLSearchParams(location.search);
  const uri = params.get('uri');
  return uri ? decodeURIComponent(uri) : '/login.html';
}

function startCountdown(seconds) {
  countdown = seconds;
  const btn = $('send-code-btn');
  btn.disabled = true;
  btn.textContent = `${countdown}s`;
  timer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.textContent = '发送验证码';
    } else {
      btn.textContent = `${countdown}s`;
    }
  }, 1000);
}

$('send-code-btn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('请输入有效邮箱', 'error');
    return;
  }
  try {
    await request('/api/auth/send-code', {
      method: 'POST',
      body: { email, purpose: 'reset' }
    });
    showToast('验证码已发送');
    startCountdown(60);
  } catch {}
});

$('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = $('email').value.trim();
  const code = $('code').value.trim();
  const oldPassword = $('oldPassword').value;
  const newPassword = $('newPassword').value;
  const confirmPassword = $('confirmPassword').value;

  if (!newPassword || !confirmPassword) {
    showToast('请填写新密码', 'error');
    return;
  }
  if (newPassword.length < 6) { showToast('密码至少 6 位', 'error'); return; }
  if (newPassword !== confirmPassword) { showToast('两次密码不一致', 'error'); return; }

  let body;
  if (needVerify) {
    if (!email || !code) { showToast('请填写邮箱与验证码', 'error'); return; }
    body = { email, code, newPassword, confirmPassword };
  } else {
    if (!oldPassword) { showToast('请输入原密码', 'error'); return; }
    body = { oldPassword, newPassword, confirmPassword };
  }

  const btn = $('submit-btn');
  btn.disabled = true;
  btn.textContent = '提交中...';
  try {
    await request('/api/auth/reset-password', {
      method: 'POST',
      auth: !needVerify,
      body
    });
    showToast('密码已重置，请重新登录');
    localStorage.removeItem('token');
    setTimeout(() => { location.href = redirectTarget(); }, 800);
  } catch {}
  btn.disabled = false;
  btn.textContent = '提交';
});

async function applyMode() {
  const settings = await loadSettings();
  needVerify = settings ? !!settings.registerNeedEmailVerity : true;

  if (needVerify) {
    $('page-title').textContent = '重置密码';
    $('page-subtitle').textContent = '通过邮箱验证码重置密码';
    $('email-group').hidden = false;
    $('code-group').hidden = false;
    $('oldpwd-group').hidden = true;

    if (getToken()) {
      const user = await fetchMe();
      if (user && user.email) {
        $('email').value = user.email;
        $('email').readOnly = true;
        $('page-title').textContent = '修改密码';
        $('page-subtitle').textContent = '已登录，验证邮箱即可修改密码';
      }
    } else {
      $('email').readOnly = false;
    }
  } else {
    $('page-title').textContent = '修改密码';
    $('page-subtitle').textContent = '请输入原密码与新密码';
    $('email-group').hidden = true;
    $('code-group').hidden = true;
    $('oldpwd-group').hidden = false;
  }
}

applyMode();