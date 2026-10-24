import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const routeCache = new Map();

function normalize(p) {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
}

function isParam(seg) {
  return seg.startsWith('[') && seg.endsWith(']') && !isCatchAll(seg);
}

function isCatchAll(seg) {
  return seg.startsWith('[...') && seg.endsWith(']');
}

function walk(dir, base, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    if (name.startsWith('_')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full, base, out);
      continue;
    }

    if (!name.endsWith('.js') && !name.endsWith('.mjs')) continue;

    const rel = normalize(path.relative(base, full)).replace(/\.m?js$/, '');

    let routePath = '/' + rel;
    if (routePath === '/index') routePath = '/';
    else if (routePath.endsWith('/index')) {
      routePath = routePath.slice(0, -'/index'.length) || '/';
    }

    const segments = routePath.split('/').filter(Boolean);

    out.push({
      file: full,
      routePath,
      segments,
      paramCount: segments.filter(s => isParam(s)).length,
      isDynamic: segments.some(s => isParam(s)),
      isCatchAll: segments.some(s => isCatchAll(s))
    });
  }
}

export function loadRoutes(functionsDir) {
  const out = [];
  if (!fs.existsSync(functionsDir)) return out;
  walk(functionsDir, functionsDir, out);

  out.sort((a, b) => {
    if (a.isCatchAll !== b.isCatchAll) return Number(a.isCatchAll) - Number(b.isCatchAll);
    if (a.isDynamic !== b.isDynamic) return Number(a.isDynamic) - Number(b.isDynamic);
    if (a.paramCount !== b.paramCount) return a.paramCount - b.paramCount;
    return b.segments.length - a.segments.length;
  });

  return out;
}

function matchSegments(route, target) {
  const segs = route.segments;
  if (!route.isCatchAll && segs.length !== target.length) return null;
  if (route.isCatchAll && target.length < segs.length - 1) return null;

  const params = {};
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (isCatchAll(seg)) {
      params[seg.slice(4, -1)] = target.slice(i);
      return params;
    }
    if (isParam(seg)) {
      params[seg.slice(1, -1)] = decodeURIComponent(target[i]);
      continue;
    }
    if (seg !== target[i]) return null;
  }
  return params;
}

async function loadHandler(file) {
  if (routeCache.has(file)) return routeCache.get(file);
  const url = pathToFileURL(file).href + `?t=${fs.statSync(file).mtimeMs}`;
  let mod;
  try {
    mod = await import(url);
  } catch (err) {
    console.error(`[router] import failed ${file}:`, err);
    routeCache.set(file, null);
    return null;
  }
  routeCache.set(file, mod);
  return mod;
}

export function clearRouteCache() {
  routeCache.clear();
}

export async function matchRoute(routes, pathname) {
  const target = pathname.split('/').filter(Boolean);
  for (const route of routes) {
    const params = matchSegments(route, target);
    if (params === null) continue;
    const handler = await loadHandler(route.file);
    if (!handler) continue;
    const hasAny = typeof handler.onRequest === 'function' ||
      typeof handler.onRequestGet === 'function' ||
      typeof handler.onRequestPost === 'function' ||
      typeof handler.onRequestPut === 'function' ||
      typeof handler.onRequestDelete === 'function' ||
      typeof handler.onRequestPatch === 'function' ||
      typeof handler.onRequestHead === 'function' ||
      typeof handler.onRequestOptions === 'function';
    if (!hasAny) continue;
    return { handler, params, route };
  }
  return null;
}

export function pickHandler(handler, method) {
  const name = 'onRequest' + method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  if (typeof handler[name] === 'function') return handler[name];
  if (typeof handler.onRequest === 'function') return handler.onRequest;
  return null;
}

export function watchRoutes(functionsDir, onChange) {
  if (!fs.existsSync(functionsDir)) return () => {};
  let timer = null;
  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      clearRouteCache();
      onChange();
    }, 200);
  };
  const watcher = fs.watch(functionsDir, { recursive: true }, trigger);
  return () => watcher.close();
}