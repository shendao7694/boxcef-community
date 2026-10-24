// @path: src/js/kvadmin.js
import { showToast } from './common/toast.js';

const $ = (id) => document.getElementById(id);

let adminToken = localStorage.getItem('adminToken') || '';
let currentBinding = 'Community-Service';
let currentKeys = [];
let currentCursor = null;
let currentKey = null;
let listComplete = true;
let valueMode = 'text';
let originalValue = '';

 
$('login-btn').addEventListener('click', () => {
  const t = $('admin-token').value.trim();
  if (!t) { showToast('请输入 token', 'error'); return; }
  adminToken = t;
  localStorage.setItem('adminToken', t);
  showPanel();
  switchBinding('Community-Service');
});

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body || {})
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    showToast(data.error || '请求失败', 'error');
    throw new Error(data.error || 'fail');
  }
  return data;
}

function showPanel() {
  $('login-view').hidden = true;
  $('panel-view').hidden = false;
}

 
document.querySelectorAll('.kv-tab').forEach(btn => {
  btn.addEventListener('click', () => switchBinding(btn.dataset.binding));
});

function switchBinding(binding) {
  currentBinding = binding;
  document.querySelectorAll('.kv-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.binding === binding);
  });
  clearEditor();
  currentKeys = [];
  currentCursor = null;
  listComplete = true;
  loadKeys(true);
}

 
$('refresh-btn').addEventListener('click', () => loadKeys(true));
$('load-more-btn').addEventListener('click', () => loadKeys(false));

async function loadKeys(reset) {
  if (reset) {
    currentKeys = [];
    currentCursor = null;
    listComplete = true;
  }
  if (!listComplete) return;

  const prefix = $('prefix-input').value.trim();
  const body = { binding: currentBinding, limit: 200 };
  if (prefix) body.prefix = prefix;
  if (currentCursor) body.cursor = currentCursor;

  let data;
  try {
    data = await api('/api/admin/kv/list', body);
  } catch {
    return;
  }

  currentKeys = currentKeys.concat(data.keys || []);
  currentCursor = data.cursor || null;
  listComplete = !!data.list_complete;

  renderKeyList();
  $('load-more-btn').hidden = listComplete;
}

function renderKeyList() {
  const box = $('key-list');
  box.innerHTML = '';
  $('key-count').textContent = currentKeys.length;

  if (!currentKeys.length) {
    box.innerHTML = '<div class="empty-text">没有 key</div>';
    return;
  }

  for (const k of currentKeys) {
    const el = document.createElement('div');
    el.className = 'kv-key-item' + (k.name === currentKey ? ' active' : '');
    el.textContent = k.name;
    if (k.expiration) {
      const exp = new Date(k.expiration).toLocaleString();
      el.title = `expire: ${exp}`;
    }
    el.addEventListener('click', () => selectKey(k.name));
    box.appendChild(el);
  }
}

 
async function selectKey(key) {
  currentKey = key;
  $('edit-key').value = key;
  renderKeyList();

  let data;
  try {
    data = await api('/api/admin/kv/get', { binding: currentBinding, key });
  } catch {
    return;
  }

  originalValue = data.value === null || data.value === undefined ? '' : String(data.value);
  applyValueMode();
  updateMeta();
}

function updateMeta() {
  const len = originalValue.length;
  const changed = originalValue !== $('edit-value').value;
  $('kv-meta').textContent = `key: ${currentKey || '-'}  ·  length: ${len}${changed ? ' · 已修改（未保存）' : ''}`;
}

function clearEditor() {
  currentKey = null;
  $('edit-key').value = '';
  $('edit-value').value = '';
  $('kv-meta').textContent = '';
  originalValue = '';
  $('edit-value').readOnly = false;
}

$('new-btn').addEventListener('click', () => {
  clearEditor();
  $('edit-key').focus();
});

$('reload-btn').addEventListener('click', async () => {
  const key = $('edit-key').value.trim();
  if (!key) { showToast('请填写 key', 'error'); return; }
  currentKey = key;
  await selectKey(key);
});

$('save-btn').addEventListener('click', async () => {
  const key = $('edit-key').value.trim();
  if (!key) { showToast('请填写 key', 'error'); return; }

  let value = $('edit-value').value;
  if (valueMode === 'json') {
    try { value = JSON.stringify(JSON.parse(value)); }
    catch { showToast('JSON 格式错误，无法保存', 'error'); return; }
  }

  const btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = '保存中...';
  try {
    const res = await api('/api/admin/kv/put', {
      binding: currentBinding,
      key,
      value
    });
    originalValue = value;
    showToast(`已保存（${res.size} 字符）`);
    if (!currentKeys.find(k => k.name === key)) {
      currentKeys.unshift({ name: key, expiration: null });
      renderKeyList();
    }
    currentKey = key;
    updateMeta();
  } catch {}
  btn.disabled = false;
  btn.textContent = '保存';
});

$('delete-btn').addEventListener('click', async () => {
  const key = $('edit-key').value.trim();
  if (!key) { showToast('请填写 key', 'error'); return; }
  if (!confirm(`确认删除 ${currentBinding} / ${key} ？`)) return;

  try {
    await api('/api/admin/kv/delete', { binding: currentBinding, key });
    showToast('已删除');
    currentKeys = currentKeys.filter(k => k.name !== key);
    renderKeyList();
    clearEditor();
  } catch {}
});

 
document.querySelectorAll('.kv-value-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    valueMode = btn.dataset.mode;
    document.querySelectorAll('.kv-value-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === valueMode);
    });
    applyValueMode();
  });
});

function applyValueMode() {
  const ta = $('edit-value');
  ta.readOnly = false;

  if (valueMode === 'text') {
    ta.value = originalValue;
    updateMeta();
    return;
  }

  if (valueMode === 'json') {
    try {
      ta.value = JSON.stringify(JSON.parse(originalValue), null, 2);
    } catch {
      ta.value = originalValue;
      showToast('不是合法 JSON，按文本显示', 'error');
    }
    updateMeta();
    return;
  }

  if (valueMode === 'base64') {
    ta.value = `[base64 预览，只读]\n\n${tryDecodePreview(originalValue)}`;
    ta.readOnly = true;
  }
}

function tryDecodePreview(raw) {
  
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.data === 'string') {
      const header = `type: ${obj.type || 'unknown'}\ndate: ${obj.date || 'unknown'}\ndata length: ${obj.data.length}\n\n`;
      return header + previewBase64(obj.data);
    }
  } catch {}
  
  return previewBase64(raw);
}

function previewBase64(b64) {
  try {
    const head = b64.slice(0, 32);
    return `前 32 字符: ${head}\n（base64 数据，共 ${b64.length} 字符）`;
  } catch {
    return '（无法预览）';
  }
}

$('edit-value').addEventListener('input', updateMeta);

 
if (adminToken) {
  $('admin-token').value = adminToken;
  showPanel();
  switchBinding('Community-Service');
} else {
  $('login-view').hidden = false;
  $('panel-view').hidden = true;
}