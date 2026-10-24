// @path: api/_libs/admin.js
export function verifyAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !env.ADMIN_TOKEN) return false;
  if (token.length !== env.ADMIN_TOKEN.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ env.ADMIN_TOKEN.charCodeAt(i);
  }
  return diff === 0;
}