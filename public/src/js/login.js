// @path: src/js/login.js
import { request, setToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';

const form = document.getElementById('login-form');
const btn = document.getElementById('submit-btn');

function redirectTarget() {
  const params = new URLSearchParams(location.search);
  const uri = params.get('uri');
  return uri ? decodeURIComponent(uri) : '/profile.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!name || !email || !password) {
    showToast('请填写所有字段', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '登录中...';

  try {
    const { token } = await request('/api/auth/login', {
      method: 'POST',
      body: { name, email, password }
    });
    setToken(token);
    showToast('登录成功');
    setTimeout(() => { location.href = redirectTarget(); }, 600);
  } catch {
    btn.disabled = false;
    btn.textContent = '登录';
  }
});