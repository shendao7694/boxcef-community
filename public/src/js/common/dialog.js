// @path: src/js/common/dialog.js
import { t } from './i18n.js';

const STYLE_ID = 'ui-dialog-style';
let styleReady = false;

function ensureStyle() {
  if (styleReady && document.getElementById(STYLE_ID)) return;
  styleReady = true;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.ui-dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10000;opacity:0;transition:opacity .18s ease;}
.ui-dialog-overlay.show{opacity:1;}
.ui-dialog{width:100%;max-width:420px;background:var(--card,#fff);color:var(--text,#000);border:1px solid var(--border,#e0e0e0);border-radius:var(--radius,12px);box-shadow:var(--shadow,0 8px 24px rgba(0,0,0,.12));padding:22px;transform:translateY(10px) scale(.98);transition:transform .18s ease;font-family:inherit;}
.ui-dialog-overlay.show .ui-dialog{transform:none;}
.ui-dialog h3{font-size:17px;font-weight:800;margin-bottom:10px;}
.ui-dialog-message{font-size:14px;line-height:1.7;color:var(--text-soft,#666);white-space:pre-wrap;word-break:break-word;margin-bottom:18px;}
.ui-dialog-input{width:100%;padding:11px 13px;border:1px solid var(--border,#e0e0e0);background:var(--bg,#fff);color:var(--text,#000);border-radius:8px;font-size:14px;outline:none;font-family:inherit;margin-bottom:18px;}
.ui-dialog-input:focus{border-color:var(--text,#000);}
.ui-dialog-actions{display:flex;justify-content:flex-end;gap:10px;}
.ui-dialog-btn{padding:9px 18px;border-radius:8px;border:1px solid var(--border,#e0e0e0);background:transparent;color:var(--text,#000);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s,border-color .2s;}
.ui-dialog-btn:hover{border-color:var(--text,#000);}
.ui-dialog-btn.primary{background:var(--accent,#000);color:var(--accent-text,#fff);border-color:var(--accent,#000);}
.ui-dialog-btn.danger{background:#e53e3e;color:#fff;border-color:#e53e3e;}
`;
  document.head.appendChild(style);
}

function open({ title, message, input, okText, cancelText, danger, defaultValue, placeholder, extra, inputType }) {
  ensureStyle();
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'ui-dialog-overlay';

    const card = document.createElement('div');
    card.className = 'ui-dialog';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const h = document.createElement('h3');
    h.textContent = title ? t(title) : t('提示');
    card.appendChild(h);

    if (message) {
      const p = document.createElement('div');
      p.className = 'ui-dialog-message';
      p.textContent = t(message);
      card.appendChild(p);
    }

    let field = null;
    if (input) {
      field = document.createElement('input');
      field.type = inputType || 'text';
      field.className = 'ui-dialog-input';
      field.value = defaultValue || '';
      if (placeholder) field.placeholder = placeholder;
      card.appendChild(field);
    }

    const actions = document.createElement('div');
    actions.className = 'ui-dialog-actions';

    let cancelBtn = null;
    if (cancelText !== null) {
      cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'ui-dialog-btn';
      cancelBtn.textContent = cancelText || t('取消');
      actions.appendChild(cancelBtn);
    }

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'ui-dialog-btn ' + (danger ? 'danger' : 'primary');
    okBtn.textContent = okText || t('确定');
    actions.appendChild(okBtn);

    if (extra && extra.text) {
      const extraBtn = document.createElement('button');
      extraBtn.type = 'button';
      extraBtn.className = 'ui-dialog-btn';
      extraBtn.textContent = extra.text;
      extraBtn.addEventListener('click', () => {
        if (typeof extra.onClick === 'function') extra.onClick(extraBtn);
      });
      actions.insertBefore(extraBtn, okBtn);
    }

    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 180);
      document.removeEventListener('keydown', onKey, true);
      resolve(value);
    };
    const cancel = () => finish(input ? null : false);

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      if (e.key === 'Enter' && input) { e.preventDefault(); finish(field.value); }
    };
    document.addEventListener('keydown', onKey, true);

    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) cancel(); });
    if (cancelBtn) cancelBtn.addEventListener('click', cancel);
    okBtn.addEventListener('click', () => finish(input ? field.value : true));

    (field || okBtn).focus();
    if (field) field.select();
  });
}

export function alert(message, options = {}) {
  return open({ ...options, message, cancelText: null }).then(() => true);
}

export function confirm(message, options = {}) {
  return open({ ...options, message, cancelText: options.cancelText || t('取消'), okText: options.okText || t('确定') }).then(v => v === true);
}

export function prompt(message, options = {}) {
  return open({
    ...options,
    message,
    input: true,
    defaultValue: options.defaultValue || '',
    placeholder: options.placeholder || '',
    inputType: options.inputType || 'text',
    cancelText: options.cancelText || t('取消'),
    okText: options.okText || t('确定')
  });
}

export const dialog = { alert, confirm, prompt };
