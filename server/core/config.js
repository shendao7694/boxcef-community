import fs from 'fs';
import path from 'path';
import { parseToml } from './toml.js';

export async function loadConfig(args) {
  const cwd = args.cwd || process.cwd();

  const tomlPath = path.join(cwd, 'wrangler.toml');
  if (!fs.existsSync(tomlPath)) {
    throw new Error(`wrangler.toml not found at ${tomlPath}`);
  }

  const raw = parseToml(fs.readFileSync(tomlPath, 'utf-8'));

  const outputDir = path.resolve(cwd, raw.pages_build_output_dir || './dist');
  const functionsDir = path.join(cwd, 'functions');

  const activeEnv = args.env || process.env.NODE_ENV || null;
  const envSection = activeEnv && raw.env && raw.env[activeEnv] ? raw.env[activeEnv] : {};

  const vars = { ...(raw.vars || {}), ...(envSection.vars || {}) };

  const kv = [...(raw.kv_namespaces || []), ...(envSection.kv_namespaces || [])];
  const r2 = [...(raw.r2_buckets || []), ...(envSection.r2_buckets || [])];
  const d1 = [...(raw.d1_databases || []), ...(envSection.d1_databases || [])];

  const persistTo = args.persistTo
    || (process.env.PERSIST_TO ? path.resolve(process.env.PERSIST_TO) : null)
    || path.join(cwd, '.server', 'data');

  const port = args.port
    || Number(process.env.PORT)
    || Number(raw.dev?.port)
    || 8788;

  const host = raw.dev?.ip || '127.0.0.1';

  return {
    cwd,
    tomlPath,
    raw,
    name: raw.name || 'worker',
    outputDir,
    functionsDir,
    vars,
    kv,
    r2,
    d1,
    persistTo,
    port,
    host,
    activeEnv
  };
}