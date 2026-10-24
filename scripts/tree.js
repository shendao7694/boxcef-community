import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'dist');
const OUTPUT = path.join(OUT_DIR, 'treedist.txt');

const IGNORE_NAMES = new Set(['node_modules', 'dist', 'docs', 'treedist.txt', 'assets', 'docs', 'wiki']);
const isIgnored = (entry) =>
  IGNORE_NAMES.has(entry.name) || (entry.isDirectory() && entry.name.startsWith('.'));

const lines = [];

function walk(dir, prefix) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  entries = entries
    .filter((e) => !isIgnored(e))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    lines.push(prefix + branch + entry.name);

    if (entry.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      walk(path.join(dir, entry.name), nextPrefix);
    }
  });
}

lines.push(path.basename(ROOT) + '/');
walk(ROOT, '');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, lines.join('\n') + '\n', 'utf8');
console.log(`Wirte to ${OUTPUT}`);