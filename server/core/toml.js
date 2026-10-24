function parseValue(v) {
  v = v.trim();
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^-?\d+\.\d+$/.test(v)) return Number(v);
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(s => parseValue(s));
  }
  return v;
}

function ensureTable(root, path) {
  let cur = root;
  for (const p of path) {
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  return cur;
}

export function parseToml(text) {
  const root = {};
  let current = root;

  for (let rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    if (line.startsWith('[[') && line.endsWith(']]')) {
      const segs = line.slice(2, -2).trim().split('.');
      const parent = ensureTable(root, segs.slice(0, -1));
      const key = segs[segs.length - 1];
      parent[key] = parent[key] || [];
      const obj = {};
      parent[key].push(obj);
      current = obj;
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      const segs = line.slice(1, -1).trim().split('.');
      current = ensureTable(root, segs);
      continue;
    }

    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = parseValue(line.slice(eq + 1));
    current[key] = value;
  }

  return root;
}