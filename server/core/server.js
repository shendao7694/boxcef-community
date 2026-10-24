import http from 'http';
import fs from 'fs';
import path from 'path';
import { buildEnv } from './env.js';
import { createKV } from './kv.js';
import { createR2 } from './r2.js';
import { createD1 } from './d1.js';
import { createStatic } from './static.js';
import { loadRoutes, matchRoute, pickHandler, watchRoutes } from './router.js';
import { buildRequest, jsonResponse, notFound } from './request.js';
import {
  info, warn, error as logError, ok, visit,
  colorStatus, colorMethod, formatStatusText, colorText
} from './logger.js';

function clientAddress(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const port = req.socket.remotePort || 0;
  const clean = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  return `${clean}:${port}`;
}

export async function startServer(config) {
  const {
    name, cwd, functionsDir, outputDir, persistTo, port, host, kv, r2, d1
  } = config;

  info('local', `${colorText('bold', 'wrangler-local')} starting`);
  info('local', `name = ${colorText('cyan', name)}`);
  info('local', `cwd = ${colorText('dim', cwd)}`);
  info('local', `functions = ${colorText('dim', functionsDir)} ${fs.existsSync(functionsDir) ? colorText('green', 'exists') : colorText('red', 'missing')}`);
  info('local', `output = ${colorText('dim', outputDir)} ${fs.existsSync(outputDir) ? colorText('green', 'exists') : colorText('red', 'missing')}`);
  info('local', `persist = ${colorText('dim', persistTo)}`);

  if (!fs.existsSync(outputDir)) {
    warn('local', `output dir not found, run "npm run build" first or set pages_build_output_dir in wrangler.toml`);
  }

  fs.mkdirSync(persistTo, { recursive: true });

  const statePath = path.join(persistTo, 'local-state.json');
  let state = {};
  if (fs.existsSync(statePath)) {
    const text = fs.readFileSync(statePath, 'utf-8').trim();
    if (text) {
      try { state = JSON.parse(text); } catch { state = {}; }
    }
  }

  function persist() {
    const tmp = statePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, statePath);
  }

  const bindings = {};

  for (const ns of kv) {
    if (!ns.binding) continue;
    bindings[ns.binding] = createKV(ns.binding, persistTo);
    info('bind', `${colorText('cyan', 'KV')} ${ns.binding}${ns.id ? ` ${colorText('dim', `id=${ns.id}`)}` : ''}`);
  }
  for (const b of r2) {
    if (!b.binding) continue;
    bindings[b.binding] = createR2(b.binding, persistTo);
    info('bind', `${colorText('magenta', 'R2')} ${b.binding}${b.bucket_name ? ` ${colorText('dim', `bucket=${b.bucket_name}`)}` : ''}`);
  }
  for (const db of d1) {
    if (!db.binding) continue;
    bindings[db.binding] = createD1(db.binding, state, persist);
    info('bind', `${colorText('yellow', 'D1')} ${db.binding}${db.database_name ? ` ${colorText('dim', `name=${db.database_name}`)}` : ''}`);
  }

  const env = buildEnv(config, bindings);
  const routes = loadRoutes(functionsDir);
  const staticHandler = createStatic(outputDir);

  ok('routes', `${routes.length} loaded`);
  for (const r of routes) {
    info('route', `${colorText('dim', r.routePath)} ${colorText('gray', '→')} ${colorText('dim', path.relative(cwd, r.file))}`);
  }

  watchRoutes(functionsDir, () => {
    info('watch', 'functions changed, reloading routes');
  });

  const server = http.createServer(async (req, res) => {
    const started = Date.now();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method.toUpperCase();
    const from = clientAddress(req);

    res.on('finish', () => {
      const ms = Date.now() - started;
      const status = res.statusCode;
      const statusText = formatStatusText(status);
      const text = `[visit] ${colorMethod(method)} ${pathname} ${colorStatus(status)}${statusText ? ' ' + colorText('dim', statusText) : ''} from ${colorText('dim', from)} ${colorText('gray', `(${ms}ms)`)}`;
      visit('local', text.replace(/^\[visit\] /, ''));
    });

    if (pathname.startsWith('/api/')) {
      const matched = await matchRoute(routes, pathname);
      if (!matched) return staticHandler.serve404(res);

      const { handler, params } = matched;
      const fn = pickHandler(handler, method);
      if (!fn) {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }

      const context = {
        request: await buildRequest(req, url),
        env,
        params,
        waitUntil: () => {},
        next: () => notFound(res)
      };

      try {
        const response = await fn(context);
        if (!response) return staticHandler.serve404(res);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (err) {
        logError('fn', `${pathname} ${err && err.message ? err.message : err}`);
        if (err && err.stack) console.error(colorText('gray', err.stack));
        jsonResponse(res, 500, { error: 'Internal Server Error' });
      }
      return;
    }

    if (staticHandler.tryServe(res, pathname)) return;

    const matched = await matchRoute(routes, pathname);
    if (matched) {
      const { handler, params } = matched;
      const fn = pickHandler(handler, method);
      if (fn) {
        const context = {
          request: await buildRequest(req, url),
          env,
          params,
          waitUntil: () => {},
          next: () => notFound(res)
        };
        try {
          const response = await fn(context);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          return res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          logError('fn', `${pathname} ${err && err.message ? err.message : err}`);
          if (err && err.stack) console.error(colorText('gray', err.stack));
          return jsonResponse(res, 500, { error: 'Internal Server Error' });
        }
      }
    }

    staticHandler.serve404(res);
  });

  server.on('error', (err) => logError('server', err.message));

  await new Promise((resolve) => server.listen(port, host, resolve));
  ok('local', `listening on ${colorText('cyan', `http://${host}:${port}`)}`);
}