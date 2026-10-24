// @path: api/_libs/cookie.js
export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const p = part.trim();
    const eq = p.indexOf('=');
    if (eq < 0) continue;
    if (p.slice(0, eq) === name) return decodeURIComponent(p.slice(eq + 1));
  }
  return '';
}

export function setCookieHeader(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite || 'Lax'}`);
  return parts.join('; ');
}

export function clearCookieHeader(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}