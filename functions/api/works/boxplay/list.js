// @path: api/works/boxplay/list.js
import { ok, fail } from '../../_libs/response.js';
import { getWorks, getUserBySessionId, getUsersMap, publicUser, mapLimit } from '../../_libs/works.js';
import { loadSession } from '../../_libs/session.js';
import { readBoxplay } from '../../_libs/boxplay.js';
import { getBoxplayIdx, boxplayTypeOf } from '../../_libs/postIdx.js';

function toCard(pid, p) {
  return {
    id: pid,
    title: p.title,
    cover: p.cover,
    description: (p.description || '').substring(0, 120),
    playurl: p.playurl,
    writer: p.writer,
    type: boxplayTypeOf(p),
    status: p.status,
    createdAt: p.createdAt
  };
}

async function attachWriters(users, items) {
  const writerMap = await getUsersMap(users, items.map(x => x.writer));
  for (const x of items) {
    const writer = writerMap.get(x.writer);
    x.writerInfo = writer ? publicUser(writer, x.writer) : null;
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const cats = [...new Set((url.searchParams.get('cats') || '').split(',').map(s => s.trim()).filter(Boolean))];
  const self = await loadSession(env, request);
  const users = env['Community-Users'];
  const works = getWorks(env);
  const service = env['Community-Service'];

  if (type === 'user') {
    const id = url.searchParams.get('id');
    if (!id) return fail('缺少 id');
    const u = await getUserBySessionId(users, id);

    const isSelf = self && self.key === id;
    const rawList = (u && u.boxplays) || [];

    const items = (await mapLimit(rawList, 10, async (pid) => {
      const p = await readBoxplay(works, pid);
      if (!p) return null;
      if (!isSelf && p.status !== 'approved') return null;
      return toCard(pid, p);
    })).filter(Boolean);

    await attachWriters(users, items);
    return ok({ boxplays: items });
  }

  if (type === 'all') {
    const useScan = cats.includes('其他');

    let ids;
    if (cats.length && !useScan) {
      const idx = await getBoxplayIdx(service);
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
    } else {
      ids = [];
      let cursor;
      do {
        const list = await works.list({ cursor, prefix: 'boxplay:' });
        for (const k of list.keys) ids.push(k.name.slice(8));
        cursor = list.cursor;
        if (list.list_complete) break;
      } while (cursor);
    }

    const items = (await mapLimit(ids, 10, async (pid) => {
      const p = await readBoxplay(works, pid);
      if (!p) return null;
      if (p.status !== 'approved') return null;
      if (cats.length && !cats.includes(boxplayTypeOf(p))) return null;
      return toCard(pid, p);
    })).filter(Boolean);

    items.sort((a, b) => b.createdAt - a.createdAt);
    await attachWriters(users, items);
    return ok({ boxplays: items });
  }

  return fail('无效的 type');
}
