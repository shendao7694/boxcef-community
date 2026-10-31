// @path: api/admin/idx/rebuild.js
import { ok, fail } from '../../_libs/response.js';
import { verifyAdmin } from '../../_libs/admin.js';
import { getWorks, mapLimit } from '../../_libs/works.js';
import {
  getPostIdx, savePostIdx, getBoxplayIdx, saveBoxplayIdx,
  addToIdx, postTypesOf, boxplayTypeOf
} from '../../_libs/postIdx.js';

export async function onRequestPost({ request, env }) {
  if (!verifyAdmin(request, env)) return fail('无权限', 401);

  const works = getWorks(env);
  const service = env['Community-Service'];

  const postIdx = {};
  const boxplayIdx = {};
  let postCount = 0;
  let boxplayCount = 0;
  let boxplayFixed = 0;

  let cursor;
  do {
    const list = await works.list({ cursor });
    await mapLimit(list.keys, 10, async (key) => {
      if (key.name.startsWith('post:')) {
        const raw = await works.get(key.name);
        if (!raw) return;
        let p;
        try { p = JSON.parse(raw); } catch { return; }
        const types = postTypesOf(p);
        if (types.length) addToIdx(postIdx, key.name.slice(5), types);
        postCount++;
      } else if (key.name.startsWith('boxplay:')) {
        const raw = await works.get(key.name);
        if (!raw) return;
        let p;
        try { p = JSON.parse(raw); } catch { return; }
        const id = key.name.slice(8);
        const type = boxplayTypeOf(p);
        if (typeof p.type !== 'string' || p.type !== type) {
          p.type = type;
          await works.put(key.name, JSON.stringify(p));
          boxplayFixed++;
        }
        addToIdx(boxplayIdx, id, [type]);
        boxplayCount++;
      }
    });
    cursor = list.cursor;
    if (list.list_complete) break;
  } while (cursor);

  await Promise.all([
    savePostIdx(service, postIdx),
    saveBoxplayIdx(service, boxplayIdx)
  ]);

  return ok({
    postCount,
    boxplayCount,
    boxplayFixed,
    postCats: Object.keys(postIdx).length,
    boxplayCats: Object.keys(boxplayIdx).length
  });
}
