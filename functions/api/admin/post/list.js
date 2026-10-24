// @path: api/admin/post/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings } from '../../_libs/settings.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const works = env['Community-Works'];
  const service = env['Community-Service'];

  const settings = await getSettings(env);
  const pinnedIds = settings.pinnedPosts || [];
  const pinnedSet = new Set(pinnedIds);
  const pinnedOrder = new Map(pinnedIds.map((pid, i) => [pid, i]));

  const posts = [];
  let cursor;
  do {
    const list = await works.list({ cursor, prefix: 'post:' });
    for (const k of list.keys) {
      const id = k.name.slice(5);
      const raw = await works.get(k.name);
      if (!raw) continue;
      let p;
      try { p = JSON.parse(raw); } catch { continue; }

      let writer = null;
      if (p.writer) {
        const wRaw = await service.get(p.writer);
        if (wRaw) {
          try {
            const w = JSON.parse(wRaw);
            writer = { key: p.writer, name: w.name, nickname: w.nickname, avatar: w.avatar };
          } catch {}
        }
      }

      posts.push({
        id,
        title: p.title || '',
        writer: p.writer,
        writerInfo: writer,
        like: p.like || 0,
        commentCount: (p.comments || []).length,
        createdAt: p.createdAt || 0,
        pinned: pinnedSet.has(id)
      });
    }
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  posts.sort((a, b) => {
    if (a.pinned && b.pinned) return pinnedOrder.get(a.id) - pinnedOrder.get(b.id);
    if (a.pinned) return -1;
    if (b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  return ok({ posts });
}