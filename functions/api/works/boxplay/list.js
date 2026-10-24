// @path: api/works/boxplay/list.js
import { ok, fail } from '../../_libs/response.js';
import { getWorks, getUserBySessionId, publicUser } from '../../_libs/works.js';
import { loadSession } from '../../_libs/session.js';
import { readBoxplay } from '../../_libs/boxplay.js'; // 修复了这里

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const self = await loadSession(env, request);
  const users = env['Community-Users'];
  const works = getWorks(env);

  let keys = [];
  if (type === 'user') {
    const id = url.searchParams.get('id');
    if (!id) return fail('缺少 id');
    const u = await getUserBySessionId(users, id);
    // 如果查别人，不要展示 pending 的
    const isSelf = self && self.key === id;
    const rawList = (u && u.boxplays) || [];
    for (const pid of rawList) {
      const p = await readBoxplay(works, pid);
      if (!p) continue;
      if (!isSelf && p.status !== 'approved') continue;
      
      const writer = await getUserBySessionId(users, p.writer);
      keys.push({
        id: pid,
        title: p.title,
        cover: p.cover,
        description: p.description.substring(0, 120),
        playurl: p.playurl,
        writer: p.writer,
        writerInfo: writer ? publicUser(writer, p.writer) : null,
        status: p.status,
        createdAt: p.createdAt
      });
    }
    return ok({ boxplays: keys });
  } 
  
  if (type === 'all') {
    let cursor;
    do {
      const list = await works.list({ cursor, prefix: 'boxplay:' });
      for (const k of list.keys) keys.push(k.name.slice(8));
      cursor = list.cursor;
      if (list.list_complete) break;
    } while (cursor);

    const out = [];
    for (const pid of keys) {
      const p = await readBoxplay(works, pid);
      if (!p) continue;
      // 首页只展示已通过的
      if (p.status !== 'approved') continue;

      const writer = await getUserBySessionId(users, p.writer);
      out.push({
        id: pid,
        title: p.title,
        cover: p.cover,
        description: p.description.substring(0, 120),
        playurl: p.playurl,
        writer: p.writer,
        writerInfo: writer ? publicUser(writer, p.writer) : null,
        status: p.status,
        createdAt: p.createdAt
      });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return ok({ boxplays: out });
  }

  return fail('无效的 type');
}