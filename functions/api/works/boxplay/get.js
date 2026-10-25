// @path: api/works/boxplay/get.js
import { ok, fail } from '../../_libs/response.js';
import { getWorks, getUserBySessionId, publicUser, safeDecode } from '../../_libs/works.js';
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

  // 组装评论数据，解码内容并获取作者信息
  const comments = [];
  for (let i = 0; i < (p.comments || []).length; i++) {
    const c = p.comments[i];
    const cAuthor = await getUserBySessionId(users, c.from);
    const reply = [];
    
    for (let j = 0; j < (c.reply || []).length; j++) {
      const r = c.reply[j];
      const rAuthor = await getUserBySessionId(users, r.from);
      reply.push({
        idx: j,
        from: r.from,
        author: rAuthor ? publicUser(rAuthor, r.from) : null,
        content: safeDecode(r.content),
        like: r.like || 0,
        liked: self ? (r.likedBy || []).includes(self.key) : false,
        isOP: r.from === p.writer
      });
    }
    
    comments.push({
      idx: i,
      from: c.from,
      author: cAuthor ? publicUser(cAuthor, c.from) : null,
      content: safeDecode(c.content),
      like: c.like || 0,
      liked: self ? (c.likedBy || []).includes(self.key) : false,
      isOP: c.from === p.writer,
      pinned: !!c.pinned,
      reply
    });
  }
  
  // 置顶评论排前面
  comments.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

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
      comments
    },
    isAuthor
  });
}