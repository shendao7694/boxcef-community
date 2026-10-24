export function buildEnv(config, bindings) {
  const env = {};
  for (const [k, v] of Object.entries(config.vars || {})) {
    env[k] = v;
  }
  for (const [k, v] of Object.entries(bindings)) {
    env[k] = v;
  }
  return env;
}