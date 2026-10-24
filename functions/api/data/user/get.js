// @path: api/data/user/get.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

function publicUser(s, key) {
  return {
    key,
    name: s.name,
    nickname: s.nickname,
    group: s.group,
    avatar: s.avatar,
    description: s.description,
    lastLoginTime: s.lastLoginTime,
    title: s.title || null
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

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id || !/^[0-9a-f]{64}$/.test(id)) return fail('无效的用户 id');

  const users = env['Community-Users'];
  const raw = await users.get(id);
  if (!raw) return fail('用户不存在', 404);

  let session;
  try { session = JSON.parse(raw); } catch { return fail('数据损坏', 500); }

  const self = await loadSession(env, request);
  const isSelf = self ? self.key === id : false;

  const targetSocial = readSocial(session);
  const selfSocial = self ? readSocial(self.session) : { following: [], followers: [], mutual: [] };

  const isFollowing = self ? selfSocial.following.includes(id) : false;
  const isFollower = self ? targetSocial.following.includes(self.key) : false;
  const isMutual = isFollowing && isFollower;

  return ok({
    user: publicUser(session, id),
    isSelf,
    isFollowing,
    isFollower,
    isMutual,
    stats: {
      following: targetSocial.following.length,
      followers: targetSocial.followers.length,
      mutual: targetSocial.mutual.length
    }
  });
}