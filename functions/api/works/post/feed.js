// @path: api/works/post/feed.js
import { ok } from '../../_libs/response.js';
import { getWorks, getUsersMap, publicUser, safeDecode, mapLimit } from '../../_libs/works.js';
import { getSettings } from '../../_libs/settings.js';
import { getPostIdx, postTypesOf } from '../../_libs/postIdx.js';

const PAGE_SIZE = 20;

function hotScore(p, now) {
  const like = p.like || 0;
  const comments = (p.comments || []).length;
  const ageHours = Math.max(1, (now - (p.createdAt || now)) / 3600000);
  return (like * 3 + comments * 2 + 1) / Math.pow(ageHours + 2, 0.6);
}

function parseCats(url) {
  const raw = url.searchParams.get('cats') || '';
  return [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))];
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const cats = parseCats(url);
  const match = url.searchParams.get('match') === 'all' ? 'all' : 'any';

  const works = getWorks(env);
  const users = env['Community-Users'];
  const service = env['Community-Service'];

  const settings = await getSettings(env);
  const pinnedIds = settings.pinnedPosts || [];
  const pinnedSet = new Set(pinnedIds);
  const pinnedOrder = new Map(pinnedIds.map((pid, i) => [pid, i]));

  const toSummary = (p, id) => ({
    id,
    title: p.title || '',
    preview: safeDecode(p.data).slice(0, 200),
    writer: p.writer,
    type: postTypesOf(p),
    like: p.like || 0,
    commentCount: (p.comments || []).length,
    createdAt: p.createdAt || 0,
    pinned: pinnedSet.has(id)
  });

  const matchesQ = (p) => {
    if (!q) return true;
    const hay = `${p.title} ${p.preview}`.toLowerCase();
    return hay.includes(q);
  };

  const all = [];

  if (cats.length) {
    const idx = await getPostIdx(service);
    let ids;
    if (match === 'all') {
      const lists = cats.map(c => idx[c] || []);
      const first = lists[0] || [];
      ids = first.filter(id => lists.every(list => list.includes(id)));
    } else {
      const seen = new Set();
      ids = [];
      for (const c of cats) {
        for (const id of (idx[c] || [])) {
          if (!seen.has(id)) {
            seen.add(id);
            ids.push(id);
          }
        }
      }
    }

    const items = (await mapLimit(ids, 10, async (id) => {
      const raw = await works.get(`post:${id}`);
      if (!raw) return null;
      let p;
      try { p = JSON.parse(raw); } catch { return null; }
      const summary = toSummary(p, id);
      return matchesQ(summary) ? summary : null;
    })).filter(Boolean);

    for (const item of items) all.push(item);
  } else {
    let cursor;
    do {
      const list = await works.list({ cursor, prefix: 'post:' });
      const batch = await Promise.all(list.keys.map(async (k) => {
        const raw = await works.get(k.name);
        if (!raw) return null;
        let p;
        try { p = JSON.parse(raw); } catch { return null; }
        const summary = toSummary(p, k.name.slice(5));
        return matchesQ(summary) ? summary : null;
      }));
      for (const item of batch) {
        if (item) all.push(item);
      }
      cursor = list.cursor;
      if (list.list_complete) break;
    } while (cursor);
  }

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

  const writerMap = await getUsersMap(users, slice.map(p => p.writer));
  const out = slice.map(p => {
    const writer = writerMap.get(p.writer);
    return {
      ...p,
      writerInfo: writer ? publicUser(writer, p.writer) : null
    };
  });

  return ok({
    posts: out,
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: start + PAGE_SIZE < total
  });
}
