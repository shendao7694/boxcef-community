// @path: src/js/disc.js
import { request } from '../js/common/api.js';
import { showToast } from '../js/common/toast.js';
import { fetchMe } from '../js/common/auth.js';

const $ = (id) => document.getElementById(id);

let me = null;
let maxLimit = 20; // 默认值，拿到真实配置后会覆盖
let selectedDisc = new Set();

async function init() {
  me = await fetchMe();
  if (!me) { location.href = '/login.html'; return; }
  
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.settings && data.settings.maxImageInDisc) {
        maxLimit = data.settings.maxImageInDisc;
      }
    }
  } catch (err) {
    console.error('获取全局设置失败，使用默认值 20', err);
  }

  await renderDisc();
}

async function renderDisc() {
  const box = $('disc-box');
  const disc = me.imageDisc || [];
  
  // 重置选择
  selectedDisc.clear();
  $('disc-select-all').checked = false;
  updateToolbar();
  
  // 更新已使用张数进度条
  const count = disc.length;
  const percent = Math.min(100, (count / maxLimit) * 100);
  
  $('disc-count-text').textContent = `已使用 ${count} / ${maxLimit} 张`;
  $('disc-space-fill').style.width = `${percent}%`;
  
  // 满了变红
  $('disc-space-fill').style.background = percent >= 100 ? '#ef4444' : 'var(--text-soft)';

  // 渲染网格
  box.innerHTML = '';
  if (!disc.length) {
    box.innerHTML = '<div class="empty-text">图盘是空的，快去上传几张图片吧</div>';
    return;
  }

  disc.forEach(hash => {
    const item = document.createElement('div');
    item.className = 'disc-item';
    item.dataset.hash = hash;
    item.innerHTML = `
      <img src="/api/data/assets/${hash}" alt="image">
      <div class="disc-check"><input type="checkbox" data-hash="${hash}"></div>
    `;
    
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const cb = item.querySelector('input');
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });

    item.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) selectedDisc.add(hash);
      else selectedDisc.delete(hash);
      item.classList.toggle('selected', e.target.checked);
      updateToolbar();
    });
    
    box.appendChild(item);
  });
}

function updateToolbar() {
  const count = selectedDisc.size;
  $('disc-selected-count').textContent = `已选 ${count} 张`;
  $('disc-delete-btn').disabled = count === 0;
  
  const allCb = $('disc-select-all');
  const boxes = document.querySelectorAll('#disc-box input[type="checkbox"]');
  if (boxes.length > 0) {
    allCb.checked = count === boxes.length;
  } else {
    allCb.checked = false;
  }

  // 引用区联动
  if (count === 1) {
    const hash = Array.from(selectedDisc)[0];
    $('disc-ref-box').hidden = false;
    $('disc-ref-input').value = `![image](/api/data/assets/${hash})`;
  } else {
    $('disc-ref-box').hidden = true;
  }
}

$('disc-select-all').addEventListener('change', (e) => {
  const checked = e.target.checked;
  document.querySelectorAll('#disc-box input[type="checkbox"]').forEach(cb => {
    cb.checked = checked;
    cb.dispatchEvent(new Event('change'));
  });
});

$('disc-copy-btn').addEventListener('click', async () => {
  const input = $('disc-ref-input');
  try {
    await navigator.clipboard.writeText(input.value);
    showToast('引用代码已复制');
  } catch {
    input.select();
    document.execCommand('copy');
    showToast('引用代码已复制');
  }
});

// ---------- 上传逻辑 ----------
$('disc-upload-btn').addEventListener('click', () => $('disc-file-input').click());

$('disc-file-input').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  e.target.value = ''; // 重置 input

  const currentCount = (me.imageDisc || []).length;
  if (currentCount + files.length > maxLimit) {
    showToast(`最多存放 ${maxLimit} 张图片，你最多还能传 ${maxLimit - currentCount} 张`, 'error');
    return;
  }

  // 显示记录区
  $('disc-history-section').hidden = false;
  $('disc-history-list').innerHTML = '';
  $('disc-history-text').textContent = `共 ${files.length} 张，已上传 0 张，失败 0 张`;
  $('disc-history-fill').style.width = '0%';
  
  const btn = $('disc-upload-btn');
  btn.disabled = true;
  btn.textContent = '上传中...';

  let success = 0;
  let fail = 0;
  let latestImageDisc = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // UI 增加一行
    const tr = document.createElement('div');
    tr.className = 'disc-history-item';
    tr.innerHTML = `<span>${file.name}</span><span class="status">等待中...</span>`;
    $('disc-history-list').appendChild(tr);

    const fd = new FormData();
    fd.append('file', file);

    try {
      // 捕获后端返回的最新 imageDisc
      const res = await request('/api/data/profile/disc-upload', {
        method: 'POST', auth: true, isForm: true, body: fd
      });
      success++;
      if (res && res.imageDisc) {
        latestImageDisc = res.imageDisc;
      }
      tr.querySelector('.status').className = 'status success';
      tr.querySelector('.status').textContent = '上传成功';
    } catch {
      fail++;
      tr.querySelector('.status').className = 'status fail';
      tr.querySelector('.status').textContent = '上传失败';
    }

    // 进度条更新
    const progress = Math.round(((i + 1) / files.length) * 100);
    $('disc-history-fill').style.width = `${progress}%`;
    $('disc-history-text').textContent = `共 ${files.length} 张，已上传 ${success} 张，失败 ${fail} 张`;
  }

  btn.disabled = false;
  btn.textContent = '+ 上传图片';
  
  if (success > 0) {
    showToast(`上传完成，成功 ${success} 张`);
    
    // 直接使用接口返回的最新数组更新本地内存，并重绘
    if (latestImageDisc) {
      me.imageDisc = latestImageDisc;
      await renderDisc();
    }
  }
});

// ---------- 删除逻辑 ----------
$('disc-delete-btn').addEventListener('click', async () => {
  if (!selectedDisc.size) return;
  if (!confirm(`确认删除选中的 ${selectedDisc.size} 张图片？此操作不可恢复。`)) return;

  const hashes = Array.from(selectedDisc);
  const btn = $('disc-delete-btn');
  btn.disabled = true;
  btn.textContent = '删除中...';

  try {
    // 同样，后端 disc-delete 已经返回了最新的 imageDisc
    const res = await request('/api/data/profile/disc-delete', {
      method: 'POST', auth: true, body: { hashes }
    });
    showToast('已删除');
    
    if (res && res.imageDisc) {
      me.imageDisc = res.imageDisc;
      await renderDisc();
    }
  } catch {
    // 如果出错恢复按钮
    btn.disabled = false;
    btn.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> 删除`;
  }
});

init();