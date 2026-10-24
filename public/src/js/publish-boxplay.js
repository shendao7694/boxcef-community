// @path: src/js/publish-boxplay.js
import { request, getToken } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe } from '../js/common/auth.js';

const $ = (id) => document.getElementById(id);
let me = null;
let selectedCover = '';

async function init() {
  if (!getToken()) { location.href = '/login.html'; return; }
  me = await fetchMe();
  if (!me) { location.href = '/login.html'; return; }
}

$('cover-preview').addEventListener('click', () => {
  const disc = me.imageDisc || [];
  if (!disc.length) {
    showToast('你的图盘是空的，请先去个人主页上传图片', 'error');
    return;
  }
  
  const box = $('disc-list');
  box.innerHTML = '';
  
  disc.forEach(hash => {
    const item = document.createElement('div');
    item.className = 'disc-item';
    item.innerHTML = `<img src="/api/data/assets/${hash}" alt="">`;
    
    item.addEventListener('click', () => {
      selectedCover = hash;
      $('b-cover').value = hash;
      
      const imgEl = $('cover-img');
      const textEl = $('cover-text');
      
      // 核心修复：强行设置样式
      imgEl.src = `/api/data/assets/${hash}`;
      imgEl.style.display = 'block'; 
      textEl.style.display = 'none';
      
      $('disc-modal').hidden = true;
    });
    
    box.appendChild(item);
  });
  
  $('disc-modal').hidden = false;
});

$('disc-cancel').addEventListener('click', () => { 
  $('disc-modal').hidden = true; 
});

$('publish-btn').addEventListener('click', async () => {
  const title = $('b-title').value.trim();
  const playurl = $('b-url').value.trim();
  const description = $('b-desc').value.trim();
  const cover = $('b-cover').value;

  if (!title) { showToast('请填写作品名称', 'error'); return; }
  if (!playurl) { showToast('请填写游玩链接', 'error'); return; }
  if (!cover) { showToast('请选择封面', 'error'); return; }

  const btn = $('publish-btn');
  btn.disabled = true;
  btn.textContent = '提交中...';

  try {
    await request('/api/works/boxplay/create', {
      method: 'POST',
      auth: true,
      body: { title, playurl, description, cover }
    });
    showToast('提交成功，请等待审核');
    setTimeout(() => { location.href = '/'; }, 1000);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '提交审核';
  }
});

init();