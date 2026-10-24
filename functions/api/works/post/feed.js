// @path: api/works/post/feed.js
import { ok, fail } from '../../_libs/response.js';
import { getWorks, getUserBySessionId, publicUser, safeDecode } from '../../_libs/works.js';
import { getSettings } from '../../_libs/settings.js';

const PAGE_SIZE = 20;

function hotScore(p, now) {
  const like = p.like || 0;
  const comments = (p.comments || []).length;
  const ageHours = Math.max(1, (now - (p.createdAt || now)) / 3600000);
  return (like * 3 + comments * 2 + 1) / Math.pow(ageHours + 2, 0.6);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();

  const works = getWorks(env);
  const users = env['Community-Users'];

  const settings = await getSettings(env);
  const pinnedIds = settings.pinnedPosts || [];
  const pinnedSet = new Set(pinnedIds);
  const pinnedOrder = new Map(pinnedIds.map((pid, i) => [pid, i]));

  const all = [];
  let cursor;
  do {
    const list = await works.list({ cursor, prefix: 'post:' });
    for (const k of list.keys) {
      const raw = await works.get(k.name);
      if (!raw) continue;
      let p;
      try { p = JSON.parse(raw); } catch { continue; }
      const id = k.name.slice(5);
      const preview = safeDecode(p.data).slice(0, 200);
      const title = p.title || '';

      if (q) {
        const hay = `${title} ${preview}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      all.push({
        id,
        title,
        preview,
        writer: p.writer,
        like: p.like || 0,
        commentCount: (p.comments || []).length,
        createdAt: p.createdAt || 0,
        pinned: pinnedSet.has(id)
      });
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  const now = Date.now();

  const pinnedPosts = all
    .filter(p => p.pinned)
    .sort((a, b) => pinnedOrder.get(a.id) - pinnedOrder.get(b.id));

  const normalPosts = all
    .filter(p => !p.pinned)
    .sort((a, b) => hotScore(b, now) - hotScore(a, now));

  const sorted = [...pinnedPosts, ...normalPosts];

  const total = sorted.length;
  const start = (page - 1) * PAGE_SIZE;
  const slice = sorted.slice(start, start + PAGE_SIZE);

  const out = [];
  for (const p of slice) {
    const writer = await getUserBySessionId(users, p.writer);
    out.push({
      ...p,
      writerInfo: writer ? publicUser(writer, p.writer) : null
    });
  }

  return ok({
    posts: out,
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: start + PAGE_SIZE < total
  });
}