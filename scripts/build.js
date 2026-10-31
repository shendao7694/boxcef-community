import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

function log(msg) {
  console.log(`[build] ${msg}`);
}

function run(cmd) {
  log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    log(`skip (not found): ${path.relative(ROOT, src)}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  log(`copied dir: ${path.relative(ROOT, src)} → ${path.relative(ROOT, dest)}`);
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    log(`skip (not found): ${path.relative(ROOT, src)}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  log(`copied file: ${path.relative(ROOT, src)} → ${path.relative(ROOT, dest)}`);
}

function ensureClean() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
    log('cleaned dist/');
  }
}

function main() {
  const start = Date.now();
  log('start');

  ensureClean();

  run('npx vite build');

  log('vite build done, copying static files...');

  copyDir(path.join(PUBLIC_DIR, 'docs'), path.join(DIST_DIR, 'docs'));
  copyDir(path.join(PUBLIC_DIR, 'assets'), path.join(DIST_DIR, 'assets'));

  copyFile(path.join(PUBLIC_DIR, 'sitemap.xml'), path.join(DIST_DIR, 'sitemap.xml'));
  
  const ms = Date.now() - start;
  log(`done in ${ms}ms`);
}

try {
  main();
} catch (err) {
  console.error('[build] failed:', err.message);
  process.exit(1);
}