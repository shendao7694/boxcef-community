// @path: api/admin/asset/upload.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { ipfsHash } from '../../_libs/ipfs.js';

const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  'text/plain', 'text/html', 'text/css', 'text/javascript',
  'application/javascript', 'application/json'
];

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const form = await request.formData();
  const file = form.get('file');
  const customKey = form.get('key');
  if (!file || typeof file === 'string') return fail('未选择文件');

  const type = file.type || 'application/octet-stream';
  if (!ALLOWED_TYPES.includes(type)) return fail(`不支持的类型：${type}`, 400);

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const key = customKey && customKey.trim() ? customKey.trim() : await ipfsHash(bytes);

  await env['Community-Assets'].put(key, JSON.stringify({
    data: base64,
    date: new Date().toISOString(),
    type,
    name: file.name
  }));

  return ok({ key, type, size: file.size });
}