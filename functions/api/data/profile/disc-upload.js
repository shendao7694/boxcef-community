// @path: api/data/profile/disc-upload.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getSettings } from '../../_libs/settings.js';
import { readUserLimit } from '../../_libs/limit.js';
import { ipfsHash } from '../../_libs/ipfs.js';

export async function onRequestPost({ request, env }) {
  const found = await loadSession(env, request);
  if (!found) return fail('未登录', 401);

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return fail('未选择文件');
  if (!file.type.startsWith('image/')) return fail('只支持图片');

  const settings = await getSettings(env);
  const limit = readUserLimit(found.session, settings);
  const limitBytes = limit.maxUploadSize * 1024;
  if (file.size > limitBytes) return fail(`单张图片不能超过 ${limit.maxUploadSize} KB`);

  const me = found.session;
  me.imageDisc = me.imageDisc || [];
  if (me.imageDisc.length >= limit.maxImageInDisc) {
    return fail(`个人图盘最多存放 ${limit.maxImageInDisc} 张图片`);
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const hash = await ipfsHash(bytes);
  const assets = env['Community-Assets'];
  const users = env['Community-Users'];

  await assets.put(hash, JSON.stringify({
    data: base64,
    date: new Date().toISOString(),
    type: file.type
  }));

  me.imageDisc.push(hash);
  await users.put(found.key, JSON.stringify(me));

  return ok({ hash, imageDisc: me.imageDisc, size: file.size, type: file.type });
}