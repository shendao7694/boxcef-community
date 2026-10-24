export function createD1(binding, store, persist) {
  store[binding] = store[binding] || { rows: [] };
  const db = store[binding];

  return {
    prepare(sql) {
      const stmt = {
        _params: [],
        bind(...params) {
          this._params = params;
          return this;
        },
        async all() {
          return { results: db.rows.slice(), success: true, meta: {} };
        },
        async first() {
          return db.rows[0] || null;
        },
        async run() {
          db.rows.push({ sql, params: stmt._params, at: Date.now() });
          persist();
          return { success: true, meta: {} };
        }
      };
      return stmt;
    },
    async exec() {
      return { success: true };
    },
    async batch(stmts) {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    }
  };
}