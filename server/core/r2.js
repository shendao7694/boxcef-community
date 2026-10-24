import fs from 'fs';
import path from 'path';

export function createR2(binding, baseDir) {
  const dir = path.join(baseDir, 'r2', binding);
  fs.mkdirSync(dir, { recursive: true });

  return {
    async get(key) {
      const file = path.join(dir, encodeURIComponent(key));
      if (!fs.existsSync(file)) return null;
      const data = fs.readFileSync(file);
      return {
        body: data,
        arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
        text: async () => data.toString('utf-8'),
        json: async () => JSON.parse(data.toString('utf-8')),
        size: data.length,
        key
      };
    },
    async put(key, value) {
      const file = path.join(dir, encodeURIComponent(key));
      let buf;
      if (typeof value === 'string') buf = Buffer.from(value);
      else if (value instanceof ArrayBuffer) buf = Buffer.from(value);
      else if (Buffer.isBuffer(value)) buf = value;
      else if (value && typeof value.arrayBuffer === 'function') buf = Buffer.from(await value.arrayBuffer());
      else buf = Buffer.from(String(value));
      fs.writeFileSync(file, buf);
      return { key, size: buf.length };
    },
    async delete(key) {
      const file = path.join(dir, encodeURIComponent(key));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    },
    async list(options = {}) {
      const prefix = options.prefix || '';
      const objects = fs.readdirSync(dir)
        .filter(f => decodeURIComponent(f).startsWith(prefix))
        .map(f => ({ key: decodeURIComponent(f) }));
      return { objects, truncated: false };
    }
  };
}