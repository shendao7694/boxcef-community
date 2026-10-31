// @path: api/admin/post/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings } from '../../_libs/settings.js';
import { mapLimit, getUsersMap } from '../../_libs/works.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const works = env['Community-Works'];
  const users = env['Community-Users'];

  const settings = await getSettings(env);
  const pinnedIds = settings.pinnedPosts || [];
  const pinnedSet = new Set(pinnedIds);
  const pinnedOrder = new Map(pinnedIds.map((pid, i) => [pid, i]));

  let ids = [];
  let cursor;
  do {
    const list = await works.list({ cursor, prefix: 'post:' });
    for (const k of list.keys) ids.push(k.name.slice(5));
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  const posts = (await mapLimit(ids, 10, async (id) => {
    const raw = await works.get(`post:${id}`);
    if (!raw) return null;
    let p;
    try { p = JSON.parse(raw); } catch { return null; }
    return {
      id,
      title: p.title || '',
      writer: p.writer,
      like: p.like || 0,
      commentCount: (p.comments || []).length,
      createdAt: p.createdAt || 0,
      pinned: pinnedSet.has(id)
    };
  })).filter(Boolean);

  posts.sort((a, b) => {
    if (a.pinned && b.pinned) return pinnedOrder.get(a.id) - pinnedOrder.get(b.id);
    if (a.pinned) return -1;
    if (b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const writerMap = await getUsersMap(users, posts.map(p => p.writer));
  for (const p of posts) {
    const w = writerMap.get(p.writer);
    p.writerInfo = w ? { key: p.writer, name: w.name, nickname: w.nickname, avatar: w.avatar } : null;
  }

  return ok({ posts });
}
