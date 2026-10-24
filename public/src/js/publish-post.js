// @path: src/js/publish.js
import { request, getToken } from './common/api.js';
import { showToast } from './common/toast.js';
import { fetchMe } from './common/auth.js';

const $ = (id) => document.getElementById(id);

let mode = 'edit';
let me = null;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderPreview() {
  const src = $('p-content').value;
  if (typeof marked === 'undefined') {
    $('p-preview').innerHTML = escapeHtml(src).replace(/\n/g, '<br>');
    return;
  }
  marked.setOptions({ breaks: true, gfm: true });
  $('p-preview').innerHTML = marked.parse(src || '');
}

document.querySelectorAll('.editor-tabs .tab').forEach(btn => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    document.querySelectorAll('.editor-tabs .tab').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    if (mode === 'preview') {
      renderPreview();
      $('p-content').hidden = true;
      $('p-preview').hidden = false;
    } else {
      $('p-content').hidden = false;
      $('p-preview').hidden = true;
    }
  });
});

function insertAtCursor(textarea, before, after, placeholder) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end) || placeholder || '';
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = next;
  const cursor = start + before.length + selected.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
}

document.querySelectorAll('.editor-toolbar button[data-insert]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tpl = btn.dataset.insert;
    const textarea = $('p-content');
    if (tpl === '**|**') insertAtCursor(textarea, '**', '**', '粗体');
    else if (tpl === '*|*') insertAtCursor(textarea, '*', '*', '斜体');
    else if (tpl === '`|`') insertAtCursor(textarea, '`', '`', 'code');
    else if (tpl === '~~|~~') insertAtCursor(textarea, '~~', '~~', '删除线');
    else if (tpl === '[|](url)') insertAtCursor(textarea, '[', '](https://)', '链接文字');
    else if (tpl === '![|](url)') insertAtCursor(textarea, '![', '](https://)', '图片描述');
    else if (tpl === '# |') insertAtCursor(textarea, '# ', '', '标题');
    else if (tpl === '> |') insertAtCursor(textarea, '> ', '', '引用');
    else if (tpl === '- |') insertAtCursor(textarea, '- ', '', '列表项');
  });
});

// ---------- popups: color / long code / iframe ----------
function closeEditorPops() {
  document.querySelectorAll('.editor-pop').forEach(p => p.remove());
  document.removeEventListener('mousedown', onDocMouseDown, true);
  document.removeEventListener('keydown', onEscKey, true);
}

function onDocMouseDown(e) {
  if (!e.target.closest('.editor-pop') && !e.target.closest('#color-btn,#code-btn,#iframe-btn,#disc-img-btn')) closeEditorPops();
}

function onEscKey(e) { if (e.key === 'Escape') closeEditorPops(); }

function openPop(anchor, titleText) {
  closeEditorPops();
  const pop = document.createElement('div');
  pop.className = 'editor-pop';
  const title = document.createElement('div');
  title.className = 'editor-pop-title';
  title.textContent = titleText;
  pop.appendChild(title);
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 252)) + 'px';
  pop.style.top = (r.bottom + 6) + 'px';
  document.addEventListener('mousedown', onDocMouseDown, true);
  document.addEventListener('keydown', onEscKey, true);
  return pop;
}

function popRow(parent, className) {
  const row = document.createElement('div');
  row.className = className || 'editor-pop-row';
  parent.appendChild(row);
  return row;
}

function popActions(parent, onOk) {
  const row = popRow(parent, 'editor-pop-actions');
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn-ghost btn-sm';
  cancel.textContent = '取消';
  cancel.addEventListener('click', closeEditorPops);
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'btn btn-sm';
  ok.textContent = '插入';
  ok.addEventListener('click', onOk);
  row.append(cancel, ok);
}

// color picker
const PALETTE = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#ef4444', '#84cc16', '#14b8a6', '#0ea5e9', '#a855f7', '#111827'];

$('color-btn').addEventListener('click', () => {
  const pop = openPop($('color-btn'), '文本颜色');
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = '#e11d48';
  const customRow = popRow(pop);
  customRow.appendChild(colorInput);
  const grid = popRow(pop, 'editor-swatch-grid');
  PALETTE.forEach(hex => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'editor-swatch';
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener('click', () => { colorInput.value = hex; });
    grid.appendChild(sw);
  });
  popActions(pop, () => {
    insertAtCursor($('p-content'), `<span style="color:${colorInput.value}">`, '</span>', '彩色文字');
    closeEditorPops();
  });
});

// long code block
const CODE_LANGS = [
  ['plaintext', '纯文本'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'],
  ['python', 'Python'], ['java', 'Java'], ['c', 'C'], ['cpp', 'C++'], ['csharp', 'C#'],
  ['go', 'Go'], ['rust', 'Rust'], ['php', 'PHP'], ['sql', 'SQL'], ['bash', 'Bash/Shell'],
  ['json', 'JSON'], ['html', 'HTML'], ['css', 'CSS'], ['markdown', 'Markdown']
];

$('code-btn').addEventListener('click', () => {
  const pop = openPop($('code-btn'), '插入长代码');
  const langRow = popRow(pop);
  const sel = document.createElement('select');
  CODE_LANGS.forEach(([v, label]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = label;
    sel.appendChild(o);
  });
  langRow.appendChild(sel);
  const taRow = popRow(pop);
  const ta = document.createElement('textarea');
  ta.placeholder = '粘贴或输入代码…';
  taRow.appendChild(ta);
  popActions(pop, () => {
    const code = ta.value.replace(/\s+$/, '');
    if (!code.trim()) { showToast('代码不能为空', 'error'); return; }
    const lang = sel.value === 'plaintext' ? '' : sel.value;
    insertAtCursor($('p-content'), '\n```' + lang + '\n' + code + '\n```\n', '', '');
    closeEditorPops();
  });
  setTimeout(() => ta.focus(), 0);
});

// iframe embed
$('iframe-btn').addEventListener('click', () => {
  const pop = openPop($('iframe-btn'), '嵌入网页 (iframe)');
  const urlRow = popRow(pop);
  const url = document.createElement('input');
  url.type = 'url';
  url.placeholder = 'https://example.com';
  urlRow.appendChild(url);
  const sizeRow = popRow(pop);
  const hLabel = document.createElement('span');
  hLabel.textContent = '高度(px)';
  hLabel.style.fontSize = '12px';
  hLabel.style.whiteSpace = 'nowrap';
  const h = document.createElement('input');
  h.type = 'number';
  h.value = '420';
  h.min = '120';
  h.max = '2000';
  sizeRow.append(hLabel, h);
  const hint = popRow(pop, 'editor-pop-hint');
  hint.textContent = '将以 iframe 嵌入该网页，宽度铺满正文';
  popActions(pop, () => {
    let src = url.value.trim();
    if (!src) { showToast('请输入网址', 'error'); return; }
    if (!/^https?:\/\//i.test(src)) src = 'https://' + src;
    const height = Math.max(120, Math.min(2000, parseInt(h.value, 10) || 420));
    const tag = `<iframe src="${src}" width="100%" height="${height}" frameborder="0" loading="lazy" allowfullscreen></iframe>`;
    insertAtCursor($('p-content'), '\n' + tag + '\n', '', '');
    closeEditorPops();
  });
  setTimeout(() => url.focus(), 0);
});

// ---------- 个人图盘插入 ----------
$('disc-img-btn').addEventListener('click', () => {
  if (!me) {
    showToast('请先登录', 'error');
    return;
  }
  const disc = me.imageDisc || [];
  if (!disc.length) {
    showToast('你的图盘还是空的，请前往个人主页上传图片', 'error');
    return;
  }

  const pop = openPop($('disc-img-btn'), '插入个人图盘图片');
  pop.classList.add('disc-pop');

  const grid = document.createElement('div');
  grid.className = 'disc-grid';

  disc.forEach(hash => {
    const item = document.createElement('div');
    item.className = 'disc-item';
    item.innerHTML = `<img src="/api/data/assets/${hash}" alt="">`;
    item.title = '点击插入';
    item.addEventListener('click', () => {
      insertAtCursor($('p-content'), `![image](/api/data/assets/${hash})`, '', '');
      closeEditorPops();
      showToast('图片已插入');
    });
    grid.appendChild(item);
  });

  pop.appendChild(grid);
});

// ---------- publish ----------
$('publish-btn').addEventListener('click', async () => {
  const title = $('p-title').value.trim();
  const content = $('p-content').value;

  if (!content.trim()) { showToast('内容不能为空', 'error'); return; }
  if (content.length > 200000) { showToast('内容过长', 'error'); return; }

  const btn = $('publish-btn');
  btn.disabled = true;
  btn.textContent = '发布中...';
  try {
    const { id } = await request('/api/works/post/create', {
      method: 'POST',
      auth: true,
      body: { title, content }
    });
    showToast('发布成功');
    setTimeout(() => { location.href = `/post.html?id=${id}`; }, 600);
  } catch {}
  btn.disabled = false;
  btn.textContent = '发布';
});

(async () => {
  if (!getToken()) { location.href = '/login.html'; return; }
  me = await fetchMe();
  if (!me) { location.href = '/login.html'; }
})();