// @path: api/works/post/list.js
import { ok, fail } from '../../_libs/response.js';
import { getWorks, getUserBySessionId, getUsersMap, publicUser, safeDecode, mapLimit } from '../../_libs/works.js';
import { postTypesOf } from '../../_libs/postIdx.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'user';
  const id = url.searchParams.get('id');

  const works = getWorks(env);
  const users = env['Community-Users'];

  let keys = [];

  if (type === 'user') {
    if (!id || !/^[0-9a-f]{64}$/.test(id)) return fail('无效的用户 id');
    const u = await getUserBySessionId(users, id);
    if (!u) return fail('用户不存在', 404);
    keys = u.posts || [];
  } else if (type === 'all') {
    let cursor;
    do {
      const list = await works.list({ cursor, prefix: 'post:' });
      for (const k of list.keys) keys.push(k.name.slice(5));
      cursor = list.cursor;
      if (list.list_complete) break;
    } while (cursor);
    keys = keys.slice(0, 100);
  } else {
    return fail('无效的 type');
  }

  const posts = (await mapLimit(keys, 10, async (pid) => {
    const raw = await works.get(`post:${pid}`);
    if (!raw) return null;
    let p;
    try { p = JSON.parse(raw); } catch { return null; }
    return {
      id: pid,
      title: p.title || '',
      preview: safeDecode(p.data).slice(0, 120),
      writer: p.writer,
      type: postTypesOf(p),
      like: p.like || 0,
      commentCount: (p.comments || []).length,
      createdAt: p.createdAt || 0
    };
  })).filter(Boolean);

  posts.sort((a, b) => b.createdAt - a.createdAt);

  const writerMap = await getUsersMap(users, posts.map(p => p.writer));
  for (const p of posts) {
    const writer = writerMap.get(p.writer);
    p.writerInfo = writer ? publicUser(writer, p.writer) : null;
  }

  return ok({ posts });
}
