// @path: api/_libs/message.js
export async function pushMessage(env, sessionKey, type, data) {
  if (!sessionKey) return;
  const users = env['Community-Users'];
  const raw = await users.get(sessionKey);
  if (!raw) return;
  let session;
  try { session = JSON.parse(raw); } catch { return; }
  session.messages = Array.isArray(session.messages) ? session.messages : [];
  session.messages.unshift({ type, data, read: false });
  if (session.messages.length > 99) session.messages.length = 99;
  await users.put(sessionKey, JSON.stringify(session));
}

export async function buildFrom(users, sessionKey) {
  const raw = await users.get(sessionKey);
  if (!raw) return { from: sessionKey, fromName: '', fromAvatar: 'COMMON:normal_avatar' };
  let s;
  try { s = JSON.parse(raw); } catch { return { from: sessionKey, fromName: '', fromAvatar: 'COMMON:normal_avatar' }; }
  return { from: sessionKey, fromName: s.nickname || s.name || '', fromAvatar: s.avatar || 'COMMON:normal_avatar' };
}