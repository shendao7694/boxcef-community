// @path: api/auth/logout.js
import { clearCookieHeader } from '../_libs/cookie.js';

export async function onRequestPost() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookieHeader('token')
    }
  });
}