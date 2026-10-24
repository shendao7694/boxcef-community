export async function buildRequest(nodeReq, url) {
  const chunks = [];
  for await (const chunk of nodeReq) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const headers = new Headers();
  for (const [k, v] of Object.entries(nodeReq.headers)) {
    if (Array.isArray(v)) v.forEach(x => headers.append(k, x));
    else if (v !== undefined) headers.set(k, v);
  }

  return new Request(url.toString(), {
    method: nodeReq.method,
    headers,
    body: ['GET', 'HEAD'].includes(nodeReq.method) ? undefined : body
  });
}

export async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}

export function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function notFound(res) {
  jsonResponse(res, 404, { error: 'Not Found' });
}