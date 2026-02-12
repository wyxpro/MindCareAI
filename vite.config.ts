import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true, exportType: 'named', namedExport: 'ReactComponent',
      },
    }),
    viteStaticCopy({
      targets: [
        { src: 'srcs/music/*', dest: 'srcs/music' },
        { src: 'srcs/enjoy/*', dest: 'srcs/enjoy' },
      ],
    }),
    miaodaDevPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
