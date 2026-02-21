import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import { miaodaDevPlugin } from "miaoda-sc-plugin";

dotenv.config();

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
    miaodaDevPlugin(),
    {
      name: 'modelscope-intern-proxy',
      configureServer(server) {
        const key = process.env.MODELSCOPE_API_KEY || process.env.VITE_MODELSCOPE_API_KEY || '';
        server.middlewares.use('/innerapi/v1/modelscope/chat/completions', async (req, res) => {
          if (!key) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'MODELSCOPE_API_KEY 未配置' }));
            return;
          }
          try {
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on('data', (c) => chunks.push(Buffer.from(c)));
              req.on('end', () => resolve());
              req.on('error', reject);
            });
            const body = chunks.length ? Buffer.concat(chunks).toString('utf-8') : '{}';
            const upstream = await fetch('https://api-inference.modelscope.cn/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
              },
              body
            });
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(err?.message || err) }));
          }
        });
      }
    },
    {
      name: 'volc-ark-responses-proxy',
      configureServer(server) {
        const key = process.env.VOLC_ARK_API_KEY || process.env.VITE_VOLC_ARK_API_KEY || '';
        server.middlewares.use('/innerapi/v1/volc/responses', async (req, res) => {
          if (!key) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'VOLC_ARK_API_KEY 未配置' }));
            return;
          }
          try {
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on('data', (c) => chunks.push(Buffer.from(c)));
              req.on('end', () => resolve());
              req.on('error', reject);
            });
            const body = chunks.length ? Buffer.concat(chunks).toString('utf-8') : '{}';
            const upstream = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
              },
              body
            });
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(err?.message || err) }));
          }
        });
      }
    },
    {
      name: 'siliconflow-audio-proxy',
      configureServer(server) {
        const key = process.env.SILICONFLOW_API_KEY || process.env.VITE_SILICONFLOW_API_KEY || '';
        server.middlewares.use('/innerapi/v1/siliconflow/audio/transcriptions', async (req, res) => {
          if (!key) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'SILICONFLOW_API_KEY 未配置' }));
            return;
          }
          try {
            // Forward the multipart/form-data request
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on('data', (c) => chunks.push(Buffer.from(c)));
              req.on('end', () => resolve());
              req.on('error', reject);
            });
            const body = Buffer.concat(chunks);
            
            const upstream = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': req.headers['content-type'] || 'multipart/form-data',
              },
              body
            });
            
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(text);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(err?.message || err) }));
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
