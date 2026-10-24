import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { register } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputDir = './public'
const outputDir = './dist'
const InputResult = {};
const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (c === 'x' ? Math.random() * 16 : Math.random() * 4 + 8) | 0).toString(16);
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
  disc: 'disc.html'
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
    rollupOptions: {
      input: InputResult,
      output: {
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          return `_static/chunks/page/${name}.[hash].js`;
        },
        manualChunks(src) {
          if (src.includes('node_modules')) {
            return 'vendor';
          }
        },
        entryFileNames: (chunkInfo) => `_static/chunks/page/${generateUUID()}.[hash].js`,
        chunkFileNames: (chunkInfo) => `_static/chunks/${generateUUID()}.[hash].js`,
        assetFileNames: (assetInfo) => `_resource/assets/${generateUUID()}.[hash].[ext]`,
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