const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const supportsColor = process.stdout.isTTY && process.env.NO_COLOR !== '1';

function c(name, text) {
  if (!supportsColor) return text;
  return `${COLORS[name] || ''}${text}${COLORS.reset}`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function now() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${pad(d.getMinutes())}`;
}

function line(level, scope, message) {
  const time = c('gray', now());
  let levelColor = 'cyan';
  if (level === 'ERROR') levelColor = 'red';
  else if (level === 'WARN') levelColor = 'yellow';
  else if (level === 'OK') levelColor = 'green';
  else if (level === 'VISIT') levelColor = 'magenta';

  const levelTag = c(levelColor, `[${level} ${time}]`);
  const scopeTag = c('dim', `[${scope}]`);
  return `${levelTag}${scopeTag} ${message}`;
}

export function info(scope, message) {
  console.log(line('INFO', scope, message));
}

export function warn(scope, message) {
  console.warn(line('WARN', scope, message));
}

export function error(scope, message) {
  console.error(line('ERROR', scope, message));
}

export function ok(scope, message) {
  console.log(line('OK', scope, message));
}

export function visit(scope, message) {
  console.log(line('VISIT', scope, message));
}

export function colorStatus(status) {
  if (status >= 500) return c('red', status);
  if (status >= 400) return c('yellow', status);
  if (status >= 300) return c('cyan', status);
  if (status >= 200) return c('green', status);
  return c('gray', status);
}

export function colorMethod(method) {
  const map = {
    GET: 'green',
    POST: 'blue',
    PUT: 'yellow',
    PATCH: 'magenta',
    DELETE: 'red',
    OPTIONS: 'gray',
    HEAD: 'gray'
  };
  return c(map[method] || 'gray', method);
}

export function colorText(name, text) {
  return c(name, text);
}

export function formatStatusText(status) {
  const map = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  return map[status] || '';
}