import { request, clearToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe, avatarUrl, invalidateMe } from '../js/common/auth.js';
import { getTitles } from '../js/common/title.js';
import { confirm, prompt } from '../js/common/dialog.js';
import { t, listLangs, getLang, setLang } from '../js/common/i18n.js';

const $ = (id) => document.getElementById(id);

const LANG_HOSTS = {
  'zh-CN': 'shequ.boxcef.top',
  'zh-TW': 'shequ-tw.boxcef.top',
  en: 'community.boxcef.top'
};

let current = null;

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const sun = $('sun-icon');
  const moon = $('moon-icon');
  if (sun) sun.style.display = theme === 'dark' ? 'none' : 'block';
  if (moon) moon.style.display = theme === 'dark' ? 'block' : 'none';
}

function switchPanel(panel) {
  document.querySelectorAll('.settings-nav').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panel);
  });
  document.querySelectorAll('.settings-panel').forEach(sec => {
    const active = sec.dataset.panel === panel;
    sec.hidden = !active;
    sec.classList.toggle('active', active);
  });
}

async function renderTitlePicker() {
  const box = $('title-picker');
  if (!box) return;
  box.innerHTML = '';

  const mine = current.title || { own: [], choose: '' };
  const own = Array.isArray(mine.own) ? mine.own : [];
  const choose = mine.choose || '';

  const none = document.createElement('button');
  none.type = 'button';
  none.className = 'title-chip none' + (choose ? '' : ' active');
  none.textContent = t('不展示');
  none.addEventListener('click', () => chooseTitle(''));
  box.appendChild(none);

  const titleMap = own.length ? await getTitles(own) : {};

  for (const id of own) {
    const info = titleMap[id];
    if (!info) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'title-chip' + (choose === id ? ' active' : '');
    const bg = info.background || {};
    if (bg.type === 'image') {
      btn.style.backgroundImage = `url('/api/data/assets/${encodeURIComponent(bg.data)}')`;
      btn.style.backgroundSize = 'cover';
      btn.style.color = '#fff';
    } else {
      btn.style.background = bg.data || '#000';
      btn.style.color = '#fff';
    }
    btn.textContent = info.name;
    btn.addEventListener('click', () => chooseTitle(id));
    box.appendChild(btn);
  }
}

async function chooseTitle(id) {
  try {
    const res = await request('/api/data/title/choose', {
      method: 'POST',
      auth: true,
      body: { id }
    });
    current.title = res.title || current.title;
    showToast(t('已保存'));
    await renderTitlePicker();
  } catch {}
}

function switchLangAndHost(lang) {
  setLang(lang);
  const targetHost = LANG_HOSTS[lang];
  if (!targetHost) return;
  if (targetHost === location.hostname) return;
  location.hostname = targetHost;
}

function initPreferences() {
  const langSelect = $('lang-select');
  langSelect.innerHTML = '';
  for (const lang of listLangs()) {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    langSelect.appendChild(opt);
  }
  langSelect.value = getLang();
  langSelect.addEventListener('change', () => {
    switchLangAndHost(langSelect.value);
  });

  const themeSelect = $('theme-select');
  themeSelect.value = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
}

async function deleteAccount() {
  const first = await confirm(t('是否确认注销账号？'), {
    title: t('注销账号'),
    danger: true,
    okText: t('确认注销')
  });
  if (!first) return;

  const code = await prompt(t('我们将向你的邮箱发送验证码'), {
    title: t('二次校验'),
    placeholder: t('请输入验证码'),
    okText: t('确定'),
    extra: {
      text: t('发送验证码'),
      onClick: async (btn) => {
        if (btn.disabled) return;
        btn.disabled = true;
        const label = btn.textContent;
        btn.textContent = t('发送中...');
        try {
          await request('/api/auth/send-code', {
            method: 'POST',
            body: { purpose: 'delete', email: current.email }
          });
          showToast(t('验证码已发送'));
        } catch {}
        btn.textContent = label;
        setTimeout(() => { btn.disabled = false; }, 5000);
      }
    }
  });
  if (code === null) return;
  if (!code.trim()) {
    showToast(t('请输入验证码'), 'error');
    return;
  }

  const second = await confirm(t('再次确认注销账号？接下来需要输入用户名、邮箱和密码进行二次校验。'), {
    title: t('二次校验'),
    danger: true,
    okText: t('下一步')
  });
  if (!second) return;

  const name = await prompt(t('请输入用户名'), { title: t('二次校验'), okText: t('下一步') });
  if (name === null) return;

  const email = await prompt(t('请输入邮箱'), { title: t('二次校验'), okText: t('下一步') });
  if (email === null) return;

  const password = await prompt(t('请输入密码'), {
    title: t('二次校验'),
    okText: t('确认注销'),
    danger: true,
    inputType: 'password'
  });
  if (password === null) return;

  try {
    await request('/api/data/profile/delete', {
      method: 'POST',
      auth: true,
      body: { code: code.trim(), name: name.trim(), email: email.trim(), password }
    });
    clearToken();
    invalidateMe();
    showToast(t('账号已注销'));
    setTimeout(() => { location.href = '/'; }, 800);
  } catch {}
}

async function init() {
  current = await fetchMe();
  if (!current) {
    location.href = '/login.html';
    return;
  }

  $('edit-avatar-preview').src = avatarUrl(current.avatar);
  $('edit-nickname').value = current.nickname || '';
  $('edit-description').value = current.description || '';
  $('edit-email').value = current.email || '';
  await renderTitlePicker();

  document.querySelectorAll('.settings-nav').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  initPreferences();

  $('edit-upload-btn').addEventListener('click', () => $('edit-avatar-input').click());

  $('edit-avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(t('图片不能超过 2MB'), 'error');
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('avatar', file);
    const btn = $('edit-upload-btn');
    btn.disabled = true;
    btn.textContent = t('上传中...');
    try {
      const { hash } = await request('/api/data/profile/avatar', {
        method: 'POST', auth: true, isForm: true, body: fd
      });
      current.avatar = hash;
      $('edit-avatar-preview').src = avatarUrl(hash);
      invalidateMe();
      showToast(t('头像已更新'));
    } catch {}
    btn.disabled = false;
    btn.textContent = t('更换头像');
    e.target.value = '';
  });

  $('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('profile-save');
    btn.disabled = true;
    btn.textContent = t('保存中...');
    try {
      const { user } = await request('/api/data/profile/update', {
        method: 'POST',
        auth: true,
        body: {
          nickname: $('edit-nickname').value.trim(),
          description: $('edit-description').value
        }
      });
      current = { ...current, ...user };
      invalidateMe();
      showToast(t('已保存'));
    } catch {}
    btn.disabled = false;
    btn.textContent = t('保存修改');
  });

  $('delete-account-btn').addEventListener('click', deleteAccount);
}

init();