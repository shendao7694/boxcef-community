// @path: api/admin/boxplay/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, getUsersMap, publicUser, mapLimit } from '../../_libs/works.js';
import { readBoxplay } from '../../_libs/boxplay.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const works = getWorks(env);
  const users = env['Community-Users'];

  const list = [];
  let cursor;
  do {
    const res = await works.list({ cursor, prefix: 'boxplay:' });
    for (const k of res.keys) list.push(k.name.slice(8));
    cursor = res.cursor;
    if (res.list_complete) break;
  } while (cursor);

  const out = (await mapLimit(list, 10, async (pid) => {
    const p = await readBoxplay(works, pid);
    if (!p) return null;
    return {
      id: pid,
      title: p.title,
      cover: p.cover,
      playurl: p.playurl,
      status: p.status,
      createdAt: p.createdAt,
      writer: p.writer
    };
  })).filter(Boolean);

  out.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.createdAt - a.createdAt;
  });

  const writerMap = await getUsersMap(users, out.map(x => x.writer));
  for (const x of out) {
    const w = writerMap.get(x.writer);
    x.writerInfo = w ? publicUser(w, x.writer) : null;
  }

  return ok({ boxplays: out });
}