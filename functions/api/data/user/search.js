// @path: api/data/user/search.js
import { ok } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { ensureUserIdx, searchUserIdx } from '../../_libs/userIdx.js';

function publicUser(session, key, isFollowing) {
  return {
    key,
    name: session.name,
    nickname: session.nickname,
    group: session.group,
    avatar: session.avatar,
    description: session.description || '',
    isFollowing
  };
}

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return ok({ users: [] });

  const self = await loadSession(env, request);
  const following = self && self.session?.social && Array.isArray(self.session.social.following)
    ? self.session.social.following
    : [];

  const res = await ensureUserIdx(env, { waitUntil });
  if (res.status !== 'ok') {
    return ok({ building: true, users: [], message: '请稍后重试，正在构建索引' });
  }

  const keys = searchUserIdx(res.idx, q);
  if (!keys.size) return ok({ users: [] });

  const usersKv = env['Community-Users'];
  const out = [];
  for (const key of keys) {
    if (self && self.key === key) continue;
    const raw = await usersKv.get(key);
    if (!raw) continue;
    try {
      const session = JSON.parse(raw);
      if (session.isban) continue;
      out.push(publicUser(session, key, following.includes(key)));
    } catch {}
    if (out.length >= 50) break;
  }

  return ok({ users: out });
}
