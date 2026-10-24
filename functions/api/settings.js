// @path: api/settings.js
import { ok } from './_libs/response.js';
import { getSettings } from './_libs/settings.js';
import { loadSession } from './_libs/session.js';
import { readUserLimit } from './_libs/limit.js';

export async function onRequestGet({ request, env }) {
  const settings = await getSettings(env);
  
  // 默认返回全局配置
  let maxUploadSize = settings.maxUploadSize;
  let maxImageInDisc = settings.maxImageInDisc;

  // 如果用户已登录，尝试获取用户个人的 limit
  const self = await loadSession(env, request);
  if (self) {
    const limit = readUserLimit(self.session, settings);
    maxUploadSize = limit.maxUploadSize;
    maxImageInDisc = limit.maxImageInDisc;
  }
  
  return ok({
    settings: {
      registerNeedEmailVerity: !!settings.registerNeedEmailVerity,
      maxImageInDisc,
      maxUploadSize
    }
  });
}