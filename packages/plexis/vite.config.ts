import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'examples',
  resolve: {
    alias: {
      '../src': path.resolve(root, 'src'),
    },
  },
});
