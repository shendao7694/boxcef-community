// @path: src/js/admin/utils/format.js
export const DEFAULT_AVATAR = 'COMMON:normal_avatar';
export const DEFAULT_AVATAR_URL = '/api/data/assets/COMMON:normal_avatar';

export function fmtTime(t) {
  if (!t || t === 'none') return '-';
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
}

export function fmtSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function isValidAvatar(v) {
  if (!v || typeof v !== 'string') return false;
  if (v === DEFAULT_AVATAR) return true;
  if (v === 'undefined' || v === 'null') return false;
  if (v.length < 8 || v.length > 128) return false;
  if (/[\/\\?#\s]/.test(v)) return false;
  return true;
}

export function avatarSrc(avatar) {
  if (!isValidAvatar(avatar)) return DEFAULT_AVATAR_URL;
  if (avatar === DEFAULT_AVATAR) return DEFAULT_AVATAR_URL;
  return `/api/data/assets/${encodeURIComponent(avatar)}`;
}

export function avatarImg(avatar, className = '', alt = '') {
  const src = avatarSrc(avatar);
  const cls = className ? ` class="${className}"` : '';
  return `<img src="${src}"${cls} alt="${alt}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_URL}'">`;
}

export function limitText(limit) {
  if (!limit) return '-';
  const up = limit.maxUploadSize ?? '-';
  const img = limit.maxImageInDisc ?? '-';
  return `${up} KB / ${img} 张`;
}

export const SVG_PIN = '<svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M14.5 3.5l6 6-3.5 1.2-3.7 3.7 1.2 5.1-1.4 1.4-4.6-4.6-5.8 5.8-1.4-1.4 5.8-5.8-4.6-4.6L3.9 9.3l5.1 1.2L12.7 7 14.5 3.5z"/></svg>';