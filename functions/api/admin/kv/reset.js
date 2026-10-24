// @path: api/admin/kv/reset.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';

function readSettings(env) {
  return {
    registerNeedEmailVerity: env.REGISTER_NEED_EMAIL_VERITY === 'true',
    tokenValidTime: Number(env.TOKEN_VALID_TIME) || 720,
    pinnedPosts: [],
    maxUploadSize: 100,
    buildUserIdxTime: 168
  };
}

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const purge = body && body.purge === true;

  const service = env['Community-Service'];
  const assets = env['Community-Assets'];
  const users = env['Community-Users'];

  const result = { purged: 0, settingsWritten: false, defaultAvatarWritten: false };

  if (purge) {
    let cursor;
    do {
      const list = await users.list({ cursor });
      for (const key of list.keys) {
        if (!/^[0-9a-f]{64}$/.test(key.name)) continue;
        await users.delete(key.name);
        result.purged++;
      }
      cursor = list.cursor;
      if (list.list_complete) break;
    } while (cursor);

    let acursor;
    do {
      const list = await assets.list({ cursor: acursor });
      for (const key of list.keys) {
        if (key.name === 'COMMON:normal_avatar') continue;
        await assets.delete(key.name);
        result.purged++;
      }
      acursor = list.cursor;
      if (list.list_complete) break;
    } while (acursor);

    let scursor;
    do {
      const list = await service.list({ cursor: scursor });
      for (const key of list.keys) {
        if (key.name.startsWith('verification:')) {
          await service.delete(key.name);
        }
      }
      scursor = list.cursor;
      if (list.list_complete) break;
    } while (scursor);

    await service.delete('userIdx');
  }

  await service.put('globalSettings', JSON.stringify(readSettings(env)));
  result.settingsWritten = true;

  await assets.put('COMMON:normal_avatar', JSON.stringify({
    data: env.DEFAULT_AVATAR_DATA || '',
    date: 'none',
    type: env.DEFAULT_AVATAR_TYPE || 'image/bmp'
  }));
  result.defaultAvatarWritten = true;

  return ok(result);
}