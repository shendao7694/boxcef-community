import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputDir = './public'
const outputDir = './dist'
const InputResult = {};
const InputHandles = {
  404: '404.html',
  index: 'index.html',
  login: 'login.html',
  register: 'register.html',
  profile: 'profile.html',
  reset: 'reset.html',
  admin: 'admin.html',
  user: 'user.html',
  post: 'post.html',
  publishPost: 'publish-post.html',
  publishBoxplay: 'publish-boxplay.html',
  boxview: 'boxview.html',
  boxplay: 'boxplay.html',
  mcjs: 'wiki/mcjs/index.html',
  oauth: 'oauth.html',
  resource: 'resource.html',
  advice: 'advice.html',
  kvadmin: 'kvadmin.html',
  rule: 'rule.html',
  disc: 'disc.html',
  message: 'message.html'
};

for(let idx in InputHandles) {
    let item = InputHandles[idx];
    InputResult[idx] = path.resolve(__dirname, `${inputDir}/${item}`)
}

export default defineConfig({
  root: 'public',
  build: {
    outDir: path.resolve(__dirname, outputDir),
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: InputResult,
      output: {
        entryFileNames: '_static/chunks/page/[name].[hash].js',
        chunkFileNames: '_static/chunks/[name].[hash].js',
        assetFileNames: '_resource/assets/[name].[hash].[ext]',
      },
    },
    assetsDir: 'assets',
    copyPublicDir: false,
  },
  publicDir: false,
  server: {
    port: 3000,
    open: true,
  },
  resolve: {},
});