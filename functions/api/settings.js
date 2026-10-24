// @path: api/settings.js
import { ok } from './_libs/response.js';
import { getSettings } from './_libs/settings.js';
import { loadSession } from './_libs/session.js';
import { readUserLimit } from './_libs/limit.js';

export async function onRequestGet({ request, env }) {
  const settings = await getSettings(env);
  
  let maxUploadSize = settings.maxUploadSize;
  let maxImageInDisc = settings.maxImageInDisc;

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
      maxUploadSize,
      boxPlayStatus: !!settings.boxPlayStatus,
      boxPlayVaildText: settings.boxPlayVaildText
    }
  });
}