#!/usr/bin/env node




import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const SRC_DIR = path.resolve(process.argv[2] || path.join(__dirname, '..'));

const OUT_FILE = path.resolve(process.argv[3] || path.join(__dirname, 'dist', 'archive.md'));

const ALLOWED_EXTS = new Set(['js', 'html', 'css', 'txt', 'json', 'toml']);
const LANG_MAP = {
  js: 'javascript',
  html: 'html',
  css: 'css',
  txt: 'text',
  json: 'json',
  toml: 'toml',
};


const IGNORED_DIRS = new Set(['node_modules', 'dist', 'server', 'assets', 'wiki', 'docs']);

const chunks = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    
    if (entry.name.startsWith('.')) continue;
    
    if (IGNORED_DIRS.has(entry.name)) continue;
    
    if (full === OUT_FILE) continue;

    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).slice(1);
      if (!ALLOWED_EXTS.has(ext)) continue;

      const rel = path.relative(SRC_DIR, full).split(path.sep).join('/');
      let content = fs.readFileSync(full, 'utf8');
      if (!content.endsWith('\n')) content += '\n';

      const lang = LANG_MAP[ext] || '';
      chunks.push(`## ${rel}\n\n\`\`\`${lang}\n${content}\`\`\`\n\n`);
      console.log(`Archive: ${rel}`);
    }
  }
}

walk(SRC_DIR);


fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, chunks.join(''));
console.log(`Finish, Out: ${path.relative(process.cwd(), OUT_FILE)}`);