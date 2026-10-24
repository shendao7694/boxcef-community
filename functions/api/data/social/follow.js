// @path: api/data/social/follow.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';

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

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { target, action } = body || {};
  if (!target || !/^[0-9a-f]{64}$/.test(target)) return fail('无效的目标');
  if (target === self.key) return fail('不能关注自己');
  if (!['follow', 'unfollow'].includes(action)) return fail('无效的操作');

  const users = env['Community-Users'];
  const targetRaw = await users.get(target);
  if (!targetRaw) return fail('用户不存在', 404);

  let targetSession;
  try { targetSession = JSON.parse(targetRaw); } catch { return fail('数据损坏', 500); }

  const selfSocial = readSocial(self.session);
  const targetSocial = readSocial(targetSession);

  if (action === 'follow') {
    if (!selfSocial.following.includes(target)) selfSocial.following.push(target);
    if (!targetSocial.followers.includes(self.key)) targetSocial.followers.push(self.key);
  } else {
    selfSocial.following = selfSocial.following.filter(x => x !== target);
    targetSocial.followers = targetSocial.followers.filter(x => x !== self.key);
  }

  const selfMutualWithTarget =
    selfSocial.following.includes(target) && selfSocial.followers.includes(target);
  if (selfMutualWithTarget) {
    if (!selfSocial.mutual.includes(target)) selfSocial.mutual.push(target);
  } else {
    selfSocial.mutual = selfSocial.mutual.filter(x => x !== target);
  }

  const targetMutualWithSelf =
    targetSocial.following.includes(self.key) && targetSocial.followers.includes(self.key);
  if (targetMutualWithSelf) {
    if (!targetSocial.mutual.includes(self.key)) targetSocial.mutual.push(self.key);
  } else {
    targetSocial.mutual = targetSocial.mutual.filter(x => x !== self.key);
  }

  self.session.social = selfSocial;
  targetSession.social = targetSocial;

  await users.put(self.key, JSON.stringify(self.session));
  await users.put(target, JSON.stringify(targetSession));

  return ok({
    isFollowing: selfSocial.following.includes(target),
    isFollower: selfSocial.followers.includes(target),
    isMutual: selfSocial.mutual.includes(target)
  });
}