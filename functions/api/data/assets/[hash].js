// @path: api/data/assets/[hash].js
import { fail } from '../../_libs/response.js';

export async function onRequestGet({ params, env }) {
  const { hash } = params;
  if (!hash) return fail('资源不存在', 404);

  const raw = await env['Community-Assets'].get(hash);
  if (!raw) return fail('资源不存在', 404);

  const { data, type } = JSON.parse(raw);
  if (!data) return fail('资源为空', 404);

  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    headers: {
      'Content-Type': type || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}