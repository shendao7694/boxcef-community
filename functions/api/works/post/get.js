// @path: api/works/post/get.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getWorks, readPost, getUserBySessionId, publicUser, safeDecode } from '../../_libs/works.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id || !/^[0-9a-f]{64}$/.test(id)) return fail('无效的帖子 id');

  const works = getWorks(env);
  const users = env['Community-Users'];

  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);

  const self = await loadSession(env, request);
  const likedBy = post.likedBy || [];

  const writer = await getUserBySessionId(users, post.writer);

  const comments = [];
  for (let i = 0; i < (post.comments || []).length; i++) {
    const c = post.comments[i];
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
        isOP: r.from === post.writer
      });
    }
    comments.push({
      idx: i,
      from: c.from,
      author: cAuthor ? publicUser(cAuthor, c.from) : null,
      content: safeDecode(c.content),
      like: c.like || 0,
      liked: self ? (c.likedBy || []).includes(self.key) : false,
      isOP: c.from === post.writer,
      pinned: !!c.pinned,
      reply
    });
  }
  comments.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return ok({
    post: {
      id,
      title: post.title || '',
      content: safeDecode(post.data),
      writer: post.writer,
      writerInfo: writer ? publicUser(writer, post.writer) : null,
      comments,
      like: post.like || 0,
      liked: self ? likedBy.includes(self.key) : false,
      createdAt: post.createdAt || 0
    },
    isAuthor: self ? self.key === post.writer : false,
    isLoggedIn: !!self
  });
}