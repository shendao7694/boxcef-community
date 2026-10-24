// @path: api/works/post/comment.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import {
  b64encode, getWorks, readPost, writePost,
  getUserBySessionId, publicUser, safeDecode
} from '../../_libs/works.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { id, content, index, replyIndex, action } = body || {};
  if (!id) return fail('缺少 id');

  const works = getWorks(env);
  const users = env['Community-Users'];

  const post = await readPost(works, id);
  if (!post) return fail('帖子不存在', 404);
  post.comments = post.comments || [];

  if (action === 'add') {
    if (!content) return fail('内容为空');
    post.comments.push({
      from: self.key,
      reply: [],
      content: b64encode(String(content).slice(0, 5000)),
      like: 0,
      likedBy: []
    });
  } else if (action === 'reply') {
    if (!content || typeof index !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c) return fail('评论不存在');
    c.reply = c.reply || [];
    c.reply.push({
      from: self.key,
      content: b64encode(String(content).slice(0, 5000)),
      like: 0,
      likedBy: []
    });
  } else if (action === 'delete') {
    if (typeof index !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c) return fail('评论不存在');
    if (c.from !== self.key && post.writer !== self.key) return fail('无权限', 403);
    post.comments.splice(index, 1);
  } else if (action === 'deleteReply') {
    if (typeof index !== 'number' || typeof replyIndex !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c || !c.reply || !c.reply[replyIndex]) return fail('回复不存在');
    const r = c.reply[replyIndex];
    if (r.from !== self.key && post.writer !== self.key) return fail('无权限', 403);
    c.reply.splice(replyIndex, 1);
  } else if (action === 'likeComment') {
    if (typeof index !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c) return fail('评论不存在');
    c.likedBy = c.likedBy || [];
    if (!c.likedBy.includes(self.key)) {
      c.likedBy.push(self.key);
      c.like = c.likedBy.length;
    }
  } else if (action === 'unlikeComment') {
    if (typeof index !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c) return fail('评论不存在');
    c.likedBy = (c.likedBy || []).filter(x => x !== self.key);
    c.like = c.likedBy.length;
  } else if (action === 'likeReply') {
    if (typeof index !== 'number' || typeof replyIndex !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c || !c.reply || !c.reply[replyIndex]) return fail('回复不存在');
    const r = c.reply[replyIndex];
    r.likedBy = r.likedBy || [];
    if (!r.likedBy.includes(self.key)) {
      r.likedBy.push(self.key);
      r.like = r.likedBy.length;
    }
  } else if (action === 'unlikeReply') {
    if (typeof index !== 'number' || typeof replyIndex !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c || !c.reply || !c.reply[replyIndex]) return fail('回复不存在');
    const r = c.reply[replyIndex];
    r.likedBy = (r.likedBy || []).filter(x => x !== self.key);
    r.like = r.likedBy.length;
  } else if (action === 'pinComment' || action === 'unpinComment') {
    if (post.writer !== self.key) return fail('只有贴主可以置顶评论', 403);
    if (typeof index !== 'number') return fail('参数错误');
    const c = post.comments[index];
    if (!c) return fail('评论不存在');
    c.pinned = action === 'pinComment';
  } else {
    return fail('无效的操作');
  }

  await writePost(works, id, post);

  const out = [];
  for (let i = 0; i < post.comments.length; i++) {
    const c = post.comments[i];
    const ca = await getUserBySessionId(users, c.from);
    const reply = [];
    for (let j = 0; j < (c.reply || []).length; j++) {
      const r = c.reply[j];
      const ra = await getUserBySessionId(users, r.from);
      reply.push({
        idx: j,
        from: r.from,
        author: ra ? publicUser(ra, r.from) : null,
        content: safeDecode(r.content),
        like: r.like || 0,
        liked: (r.likedBy || []).includes(self.key),
        isOP: r.from === post.writer
      });
    }
    out.push({
      idx: i,
      from: c.from,
      author: ca ? publicUser(ca, c.from) : null,
      content: safeDecode(c.content),
      like: c.like || 0,
      liked: (c.likedBy || []).includes(self.key),
      isOP: c.from === post.writer,
      pinned: !!c.pinned,
      reply
    });
  }
  out.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return ok({ comments: out, isAuthor: post.writer === self.key });
}