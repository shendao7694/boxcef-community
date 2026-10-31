// @path: api/admin/advice/list.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getAdvice } from '../../_libs/advice.js';
import { b64decode, getUsersMap, publicUser } from '../../_libs/works.js';

export async function onRequestGet({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const service = env['Community-Service'];
  const users = env['Community-Users'];
  const list = await getAdvice(service);

  const userMap = await getUsersMap(users, list.map(a => a.from));

  const out = list.map((a, i) => {
    const user = userMap.get(a.from);
    return {
      idx: i,
      from: a.from,
      author: user ? publicUser(user, a.from) : null,
      content: safeDecode(a.content),
      status: a.status || 'pending',
      createdAt: a.createdAt || 0,
      handledAt: a.handledAt || null
    };
  });

  return ok({ advice: out });
}

function safeDecode(b64) {
  try { return b64decode(b64); } catch { return ''; }
}