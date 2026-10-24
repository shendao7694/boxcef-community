// @path: api/data/social/list.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { ensureUserIdx, searchUserIdx } from '../../_libs/userIdx.js';

function publicUser(s, key, isFollowing) {
  return {
    key,
    name: s.name,
    nickname: s.nickname,
    group: s.group,
    avatar: s.avatar,
    description: s.description,
    isFollowing
  };
}

function readSocial(s) {
  const so = s && s.social;
  if (!so || typeof so !== 'object') {
    return { following: [], followers: [], mutual: [] };
  }
  return {
    following: Array.isArray(so.following) ? so.following : [],
    followers: Array.isArray(so.followers) ? so.followers : [],
    mutual: Array.isArray(so.mutual) ? so.mutual : []
  };
}

async function fetchMany(users, selfFollowing, keys) {
  const out = [];
  for (const k of keys) {
    const raw = await users.get(k);
    if (!raw) continue;
    try {
      const s = JSON.parse(raw);
      out.push(publicUser(s, k, selfFollowing.includes(k)));
    } catch {}
  }
  return out;
}

export async function onRequestGet(context) {
  const { request, env, waitUntil } = context;

  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'mutual';
  const q = (url.searchParams.get('q') || '').trim();

  const users = env['Community-Users'];
  const follow = readSocial(self.session);

  if (type === 'mutual') {
    return ok({ users: await fetchMany(users, follow.following, follow.mutual) });
  }
  if (type === 'followers') {
    return ok({ users: await fetchMany(users, follow.following, follow.followers) });
  }
  if (type === 'following') {
    return ok({ users: await fetchMany(users, follow.following, follow.following) });
  }

  if (type === 'search') {
    const res = await ensureUserIdx(env, { waitUntil });
    if (res.status !== 'ok') {
      return ok({ building: true, users: [], message: '请稍后重试，正在构建索引' });
    }
    if (!q) return ok({ users: [] });

    const keys = searchUserIdx(res.idx, q);
    if (!keys.size) return ok({ users: [] });

    const out = [];
    for (const k of keys) {
      if (k === self.key) continue;
      const raw = await users.get(k);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw);
        out.push(publicUser(s, k, follow.following.includes(k)));
      } catch {}
      if (out.length >= 50) break;
    }
    return ok({ users: out });
  }

  return fail('无效的 type');
}