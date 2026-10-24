// @path: api/works/post/upload.js
import { ok, fail } from '../../_libs/response.js';
import { loadSession } from '../../_libs/session.js';
import { getSettings } from '../../_libs/settings.js';
import { readUserLimit } from '../../_libs/limit.js';
import { ipfsHash } from '../../_libs/ipfs.js';

export async function onRequestPost({ request, env }) {
  const self = await loadSession(env, request);
  if (!self) return fail('未登录', 401);

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return fail('未选择文件');
  if (!file.type.startsWith('image/')) return fail('只支持图片');

  const settings = await getSettings(env);
  const limit = readUserLimit(self.session, settings);
  const limitBytes = limit.maxUploadSize * 1024;
  if (file.size > limitBytes) return fail(`文件不能超过 ${limit.maxUploadSize} KB`);

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const hash = await ipfsHash(bytes);
  await env['Community-Assets'].put(hash, JSON.stringify({
    data: base64,
    date: new Date().toISOString(),
    type: file.type
  }));

  return ok({ url: `/api/data/assets/${hash}` });
}