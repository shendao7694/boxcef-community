#!/usr/bin/env node
import path from 'path';
import { loadConfig } from './core/config.js';
import { startServer } from './core/server.js';
import { error as logError } from './core/logger.js';

function parseArgs(argv) {
  const args = { cwd: process.cwd(), port: null, persistTo: null, env: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cwd' || a === '-c') args.cwd = path.resolve(argv[++i]);
    else if (a === '--port' || a === '-p') args.port = Number(argv[++i]);
    else if (a === '--persist-to') args.persistTo = path.resolve(argv[++i]);
    else if (a === '--env' || a === '-e') args.env = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv);

process.on('uncaughtException', (err) => logError('uncaught', err.message || String(err)));
process.on('unhandledRejection', (err) => logError('unhandled', err && err.message ? err.message : String(err)));

try {
  const config = await loadConfig(args);
  await startServer(config);
} catch (err) {
  logError('fatal', err.message || String(err));
  process.exit(1);
}