// @path: src/js/common/i18n.js
import zhCN from '../../langs/zh-CN.js';
import zhTW from '../../langs/zh-TW.js';
import en from '../../langs/en.js';

const LANGS = { 'zh-CN': zhCN, 'zh-TW': zhTW, en };
const DEFAULT_LANG = 'zh-CN';
const STORAGE_KEY = 'lang';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

let current = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
if (!LANGS[current]) current = DEFAULT_LANG;

const dict = () => LANGS[current].translations || {};

function lookup(text) {
  if (!text) return text;
  const d = dict();
  return Object.prototype.hasOwnProperty.call(d, text) ? d[text] : text;
}

export function t(text, vars) {
  let out = lookup(String(text ?? ''));
  if (vars && typeof vars === 'object') {
    for (const key of Object.keys(vars)) {
      out = out.split(`{${key}}`).join(String(vars[key]));
    }
  }
  return out;
}

export function getLang() { return current; }

export function getLangName(lang = current) {
  return (LANGS[lang] && LANGS[lang].name) || lang;
}

export function listLangs() {
  return Object.keys(LANGS).map(code => ({ code, name: LANGS[code].name }));
}

function translateTextNode(node) {
  const parent = node.parentElement;
  if (!parent || SKIP_TAGS.has(parent.tagName)) return;
  if (parent.closest('[data-no-i18n]')) return;

  if (typeof node.__i18nSource !== 'string') node.__i18nSource = node.nodeValue;
  const raw = node.__i18nSource;
  const trimmed = raw.trim();
  if (!trimmed) return;

  const lead = raw.slice(0, raw.indexOf(trimmed));
  const tail = raw.slice(raw.indexOf(trimmed) + trimmed.length);
  const next = lead + lookup(trimmed) + tail;
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateAttrs(el) {
  if (SKIP_TAGS.has(el.tagName)) return;
  if (el.closest('[data-no-i18n]')) return;
  if (!el.__i18nAttrs) el.__i18nAttrs = {};
  for (const attr of ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    if (typeof el.__i18nAttrs[attr] !== 'string') {
      el.__i18nAttrs[attr] = el.getAttribute(attr);
    }
    const raw = el.__i18nAttrs[attr];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const next = lookup(trimmed);
    if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
  }
}

export function apply(root = document) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
  let node = walker.currentNode;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    else if (node.nodeType === Node.ELEMENT_NODE) translateAttrs(node);
    node = walker.nextNode();
  }
}

let observer = null;

function startObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const n of m.addedNodes) {
          if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) apply(n);
        }
      } else if (m.type === 'characterData') {
        translateTextNode(m.target);
      } else if (m.type === 'attributes') {
        translateAttrs(m.target);
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS
  });
}

export function setLang(lang) {
  if (!LANGS[lang]) lang = DEFAULT_LANG;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.setAttribute('lang', lang);
  apply(document);
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

document.documentElement.setAttribute('lang', current);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    apply(document);
    startObserver();
  }, { once: true });
} else {
  apply(document);
  startObserver();
}

window.__i18n = { t, setLang, getLang, apply };
