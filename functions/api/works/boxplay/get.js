// @path: api/works/boxplay/get.js
import { ok, fail } from '../../_libs/response.js';
import { getWorks, getUserBySessionId, publicUser } from '../../_libs/works.js';
import { loadSession } from '../../_libs/session.js';
import { readBoxplay } from '../../_libs/boxplay.js';

export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('id');
  const works = getWorks(env);
  const p = await readBoxplay(works, id);
  if (!p) return fail('作品不存在', 404);

  const self = await loadSession(env, request);
  const isAuthor = self && self.key === p.writer;
  if (p.status !== 'approved' && !isAuthor) {
    return fail('作品审核中，暂不可见', 403);
  }

  const users = env['Community-Users'];
  const writer = await getUserBySessionId(users, p.writer);

  return ok({
    boxplay: {
      id,
      title: p.title,
      description: p.description,
      cover: p.cover,
      playurl: p.playurl,
      writer: p.writer,
      writerInfo: writer ? publicUser(writer, p.writer) : null,
      status: p.status,
      createdAt: p.createdAt,
      comments: p.comments || []
    },
    isAuthor
  });
}