// @path: api/_libs/response.js
export function ok(data = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function fail(error, status = 400) {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}