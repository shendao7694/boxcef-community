// @path: src/js/register.js
import { request, setToken } from '../js/common/api.js';
import { invalidateMe } from './common/auth.js';
import { showToast } from '../js/common/toast.js';

const form = document.getElementById('register-form');
const btn = document.getElementById('submit-btn');
const sendBtn = document.getElementById('send-code-btn');
const codeGroup = document.getElementById('code-group');
const agreeRule = document.getElementById('agree-rule');
const emailHint = document.getElementById('email-hint');
const emailHintToggle = document.getElementById('email-hint-toggle');
const emailHintDetail = document.getElementById('email-hint-detail');

let countdown = 0;
let timer = null;
let allowedEmail = [];

function isEmailAllowed(email) {
  if (!allowedEmail.length) return true;
  const value = String(email || '').trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at < 0) return false;
  const domain = value.slice(at);
  return allowedEmail.some(suffix => domain === suffix || domain.endsWith('.' + suffix.slice(1)));
}

function renderEmailHint(list) {
  allowedEmail = list;
  if (!list.length || !emailHint || !emailHintDetail) return;
  emailHint.hidden = false;
  emailHintDetail.textContent = `允许的邮箱后缀：${list.join('、')}`;
  emailHintToggle.addEventListener('click', () => {
    emailHintDetail.hidden = !emailHintDetail.hidden;
    emailHintToggle.textContent = emailHintDetail.hidden ? '查看详细' : '收起';
  });
}

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
  return uri ? decodeURIComponent(uri) : '/profile.html';
}

function startCountdown(seconds) {
  countdown = seconds;
  sendBtn.disabled = true;
  sendBtn.textContent = `${countdown}s`;
  timer = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(timer);
      sendBtn.disabled = false;
      sendBtn.textContent = '发送验证码';
    } else {
      sendBtn.textContent = `${countdown}s`;
    }
  }, 1000);
}

sendBtn.addEventListener('click', async () => {
  const email = form.email.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('请输入有效邮箱', 'error');
    return;
  }
  if (!isEmailAllowed(email)) {
    showToast('不允许的邮箱后缀', 'error');
    return;
  }
  try {
    await request('/api/auth/send-code', {
      method: 'POST',
      body: { email, purpose: 'register' }
    });
    showToast('验证码已发送');
    startCountdown(60);
  } catch {}
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const nickname = form.nickname.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;
  const code = form.code ? form.code.value.trim() : '';

  if (!name || !email || !password || !confirmPassword) {
    showToast('请填写必填项', 'error');
    return;
  }
  if (name.length < 2 || name.length > 20) { showToast('用户名长度 2-20', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('请输入有效邮箱', 'error'); return; }
  if (!isEmailAllowed(email)) { showToast('不允许的邮箱后缀', 'error'); return; }
  if (password.length < 6) { showToast('密码至少 6 位', 'error'); return; }
  if (password !== confirmPassword) { showToast('两次密码不一致', 'error'); return; }

  if (!agreeRule || !agreeRule.checked) {
    showToast('请先阅读并同意社区规范', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '注册中...';

  try {
    const { token } = await request('/api/auth/register', {
      method: 'POST',
      body: { name, nickname, email, password, confirmPassword, code }
    });
    setToken(token);
    invalidateMe();
    showToast('注册成功，欢迎加入');
    setTimeout(() => { location.href = redirectTarget(); }, 700);
  } catch {
    btn.disabled = false;
    btn.textContent = '注册';
  }
});

(async () => {
  const settings = await loadSettings();
  if (!settings) return;
  renderEmailHint(Array.isArray(settings.allowedEmail) ? settings.allowedEmail : []);
  if (settings.registerNeedEmailVerity === false) {
    codeGroup.hidden = true;
  }
})();