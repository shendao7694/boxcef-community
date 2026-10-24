import fs from 'fs';
import path from 'path';

function encodeKey(key) {
  return Buffer.from(String(key), 'utf-8').toString('base64');
}

function decodeKey(name) {
  try { return Buffer.from(name, 'base64').toString('utf-8'); } catch { return name; }
}

export function createKV(binding, baseDir) {
  const dir = path.join(baseDir, 'kv', binding);
  fs.mkdirSync(dir, { recursive: true });

  function fileOf(key) {
    return path.join(dir, encodeKey(key));
  }

  return {
    async get(key, options = {}) {
      const file = fileOf(key);
      if (!fs.existsSync(file)) return null;
      const text = fs.readFileSync(file, 'utf-8');
      if (options.type === 'json') {
        try { return JSON.parse(text); } catch { return null; }
      }
      if (options.type === 'arrayBuffer') {
        const buf = fs.readFileSync(file);
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
      return text;
    },
    async put(key, value) {
      fs.writeFileSync(fileOf(key), String(value));
    },
    async delete(key) {
      const file = fileOf(key);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    },
    async list(options = {}) {
      const prefix = options.prefix || '';
      const keys = fs.readdirSync(dir)
        .map(decodeKey)
        .filter(k => k.startsWith(prefix))
        .map(name => ({ name }));
      return { keys, list_complete: true, cursor: undefined };
    }
  };
}