// @path: api/_libs/limit.js
import { getSettings } from './settings.js';

export function defaultLimit(settings) {
  return {
    maxUploadSize: settings.maxUploadSize ?? 100,
    maxImageInDisc: settings.maxImageInDisc ?? 20,
    publishPostMax: settings.publishPostMax ?? 20,
    publishBoxPlayMax: settings.publishBoxPlayMax ?? 1,
    publishPostCooling: settings.publishPostCooling ?? 60,
    publishBoxPlayCooling: settings.publishBoxPlayCooling ?? 300
  };
}

export function readUserLimit(session, settings) {
  const base = defaultLimit(settings);
  const l = session && session.limit;
  if (!l || typeof l !== 'object') return base;
  return {
    maxUploadSize: Number.isFinite(Number(l.maxUploadSize)) && Number(l.maxUploadSize) > 0 ? Number(l.maxUploadSize) : base.maxUploadSize,
    maxImageInDisc: Number.isFinite(Number(l.maxImageInDisc)) && Number(l.maxImageInDisc) > 0 ? Number(l.maxImageInDisc) : base.maxImageInDisc,
    publishPostMax: Number.isFinite(Number(l.publishPostMax)) && Number(l.publishPostMax) > 0 ? Number(l.publishPostMax) : base.publishPostMax,
    publishBoxPlayMax: Number.isFinite(Number(l.publishBoxPlayMax)) && Number(l.publishBoxPlayMax) > 0 ? Number(l.publishBoxPlayMax) : base.publishBoxPlayMax,
    publishPostCooling: Number.isFinite(Number(l.publishPostCooling)) && Number(l.publishPostCooling) >= 0 ? Number(l.publishPostCooling) : base.publishPostCooling,
    publishBoxPlayCooling: Number.isFinite(Number(l.publishBoxPlayCooling)) && Number(l.publishBoxPlayCooling) >= 0 ? Number(l.publishBoxPlayCooling) : base.publishBoxPlayCooling
  };
}

export async function ensureUserLimit(env, session, sessionKey) {
  const settings = await getSettings(env);
  const merged = readUserLimit(session, settings);
  const needWrite = !session.limit || session.limit.maxUploadSize !== merged.maxUploadSize || session.limit.publishPostMax !== merged.publishPostMax;
  if (needWrite) {
    session.limit = merged;
    if (sessionKey) await env['Community-Users'].put(sessionKey, JSON.stringify(session));
  }
  return merged;
}