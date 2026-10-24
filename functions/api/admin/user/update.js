// @path: api/admin/user/update.js
import { sha256 } from '../../_libs/crypto.js';
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getSettings } from '../../_libs/settings.js';
import { defaultLimit, readUserLimit } from '../../_libs/limit.js';

function sanitize(s) {
  const { password, ...rest } = s;
  return rest;
}

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const { key, patch } = body || {};
  if (!key || !patch) return fail('缺少参数');

  const users = env['Community-Users'];
  const assets = env['Community-Assets'];

  const raw = await users.get(key);
  if (!raw) return fail('用户不存在', 404);

  let session;
  try { session = JSON.parse(raw); } catch { return fail('数据损坏'); }

  const next = { ...session };
  let rawNewPassword = null;

  if (patch.name !== undefined) {
    const n = String(patch.name).trim();
    if (n.length < 2 || n.length > 20) return fail('用户名长度 2-20');
    next.name = n;
  }
  if (patch.nickname !== undefined) {
    const n = String(patch.nickname).trim();
    if (n.length < 1 || n.length > 20) return fail('昵称长度 1-20');
    next.nickname = n;
  }
  if (patch.email !== undefined) {
    const e = String(patch.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return fail('邮箱格式错误');
    next.email = e;
  }
  if (patch.group !== undefined) {
    next.group = String(patch.group).trim() || 'user';
  }
  if (patch.description !== undefined) {
    const d = String(patch.description);
    if (d.length > 200) return fail('简介最多 200 字');
    next.description = d;
  }
  if (patch.avatar !== undefined) {
    const target = String(patch.avatar);
    const old = session.avatar;
    if (old && old !== 'COMMON:normal_avatar' && old !== target) {
      await assets.delete(old);
    }
    next.avatar = target || 'COMMON:normal_avatar';
  }
  if (patch.limit !== undefined) {
    const settings = await getSettings(env);
    const base = defaultLimit(settings);
    const cur = readUserLimit(next, settings);
    const l = patch.limit || {};
    const nextLimit = { ...cur };

    if (l.maxUploadSize !== undefined && l.maxUploadSize !== '') {
      const n = Number(l.maxUploadSize);
      if (!Number.isFinite(n) || n <= 0) return fail('limit.maxUploadSize 无效');
      nextLimit.maxUploadSize = Math.floor(n);
    }
    if (l.maxImageInDisc !== undefined && l.maxImageInDisc !== '') {
      const n = Number(l.maxImageInDisc);
      if (!Number.isFinite(n) || n <= 0) return fail('limit.maxImageInDisc 无效');
      nextLimit.maxImageInDisc = Math.floor(n);
    }
    if (l.publishPostMax !== undefined) nextLimit.publishPostMax = Math.floor(Number(l.publishPostMax));
    if (l.publishBoxPlayMax !== undefined) nextLimit.publishBoxPlayMax = Math.floor(Number(l.publishBoxPlayMax));
    if (l.publishPostCooling !== undefined) nextLimit.publishPostCooling = Math.floor(Number(l.publishPostCooling));
    if (l.publishBoxPlayCooling !== undefined) nextLimit.publishBoxPlayCooling = Math.floor(Number(l.publishBoxPlayCooling));
    next.limit = nextLimit;
  }
  if (patch.password !== undefined && patch.password !== '') {
    const p = String(patch.password);
    if (p.length < 6) return fail('密码至少 6 位');
    rawNewPassword = p;
    next.password = await sha256(p);
  }

  const nameChanged = next.name !== session.name;
  const emailChanged = next.email !== session.email;
  const passChanged = rawNewPassword !== null;

  if (nameChanged || emailChanged || passChanged) {
    if (!passChanged) {
      return fail('更换用户名或邮箱时必须同时提供新密码', 400);
    }
    const newKey = await sha256(next.name + next.email + rawNewPassword);
    if (newKey !== key) {
      const conflict = await users.get(newKey);
      if (conflict) return fail('目标用户已存在', 400);
    }
    await users.put(newKey, JSON.stringify(next));
    if (newKey !== key) {
      await users.delete(key);
    }
    return ok({ user: sanitize(next), key: newKey });
  }

  await users.put(key, JSON.stringify(next));
  return ok({ user: sanitize(next), key });
}