// @path: api/admin/boxplay/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, getUserBySessionId, publicUser } from '../../_libs/works.js';
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

  const out = [];
  for (const pid of list) {
    const p = await readBoxplay(works, pid);
    if (!p) continue;
    
    const writer = await getUserBySessionId(users, p.writer);
    out.push({
      id: pid,
      title: p.title,
      cover: p.cover,
      playurl: p.playurl,
      status: p.status,
      createdAt: p.createdAt,
      writer: p.writer,
      writerInfo: writer ? publicUser(writer, p.writer) : null
    });
  }

  
  out.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.createdAt - a.createdAt;
  });

  return ok({ boxplays: out });
}