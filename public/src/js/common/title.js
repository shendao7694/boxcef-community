// @path: src/js/common/title.js
const cache = new Map();
const pending = new Map();

export async function getTitle(id) {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);
  if (pending.has(id)) return pending.get(id);

  const p = fetch(`/api/data/title/get?id=${encodeURIComponent(id)}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      const t = d && d.title ? d.title : null;
      cache.set(id, t);
      pending.delete(id);
      return t;
    })
    .catch(() => {
      pending.delete(id);
      return null;
    });

  pending.set(id, p);
  return p;
}

export async function getTitles(ids) {
  const out = {};
  const missing = [];
  for (const id of ids) {
    if (!id) continue;
    if (cache.has(id)) {
      if (cache.get(id)) out[id] = cache.get(id);
    } else {
      missing.push(id);
    }
  }
  if (missing.length) {
    try {
      const r = await fetch('/api/data/title/getMany', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...new Set(missing)] })
      });
      if (r.ok) {
        const d = await r.json();
        for (const [id, t] of Object.entries(d.titles || {})) {
          cache.set(id, t);
          out[id] = t;
        }
      }
    } catch {}
  }
  return out;
}

export function clearTitleCache(id) {
  if (id) cache.delete(id);
  else cache.clear();
}

export function renderTitleTag(userTitle, titles) {
  if (!userTitle || !userTitle.choose) return '';
  const info = titles[userTitle.choose];
  if (!info) return '';
  const bg = info.background || {};
  const style = bg.type === 'image'
    ? `background-image:url('/api/data/assets/${encodeURIComponent(bg.data)}');background-size:cover;background-position:center;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);`
    : `background:${escapeCss(bg.data || '#000')};color:#fff;`;
  return `<span class="user-title" style="${style}">${escapeHtml(info.name)}</span>`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function escapeCss(str) {
  return String(str ?? '').replace(/[^#0-9a-zA-Z(),.%\s-]/g, '');
}