// @path: api/admin/boxplay/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, getUsersMap, publicUser, mapLimit } from '../../_libs/works.js';
import { readBoxplay } from '../../_libs/boxplay.js';
import { boxplayTypeOf } from '../../_libs/postIdx.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const status = (url.searchParams.get('status') || '').trim();
  const cat = (url.searchParams.get('cat') || '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const rawSize = Number(url.searchParams.get('pageSize')) || 10;
  const pageSize = [10, 30, 50, 100].includes(rawSize) ? rawSize : 10;

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

  let out = (await mapLimit(list, 10, async (pid) => {
    const p = await readBoxplay(works, pid);
    if (!p) return null;
    return {
      id: pid,
      title: p.title,
      cover: p.cover,
      playurl: p.playurl,
      description: p.description || '',
      type: boxplayTypeOf(p),
      isInIframe: !!p.isInIframe,
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

  if (status) out = out.filter(x => x.status === status);
  if (cat) out = out.filter(x => x.type === cat);
  if (q) {
    out = out.filter(x => {
      const hay = `${x.title || ''} ${x.description || ''} ${x.writerInfo?.name || ''} ${x.writerInfo?.nickname || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const total = out.length;
  const start = (page - 1) * pageSize;

  return ok({
    boxplays: out.slice(start, start + pageSize),
    total,
    page,
    pageSize
  });
}
