// @path: api/_libs/cors.js
const DEFAULT_METHODS = 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS';
const DEFAULT_HEADERS = 'Content-Type,Authorization,X-Requested-With';
const MAX_AGE = '86400';

function parseOrigins(value) {
  if (!value) return [];
  return String(value).split(',').map(s => s.trim()).filter(Boolean);
}

export function resolveOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (!origin) return '';
  const allowed = parseOrigins(env && env.CORS_ORIGINS);
  if (allowed.includes('*')) return origin;
  return allowed.includes(origin) ? origin : '';
}

export function corsHeaders(request, env) {
  const origin = resolveOrigin(request, env);
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': DEFAULT_METHODS,
    'Access-Control-Allow-Headers': DEFAULT_HEADERS,
    'Access-Control-Max-Age': MAX_AGE
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

export function applyCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, env))) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function preflightResponse(request, env) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}
