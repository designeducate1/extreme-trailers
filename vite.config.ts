import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import fs from 'fs';
import {parse} from 'dotenv';

// Lets the hidden helpers (netlify/functions/ross-start-call.mts, wind.mts) run inside
// the normal local preview. Settings are re-read from .env.local on every
// request, so flipping ROSS_ENABLED takes effect without a restart.
function rossDevHelper(): Plugin {
  return {
    name: 'ross-dev-helper',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = (req.url || '').match(/^\/\.netlify\/functions\/(ross-start-call|wind)(\?.*)?$/);
        if (!m) return next();
        try {
          // Read .env then .env.local fresh each time (later file wins)
          for (const f of ['.env', '.env.local']) {
            const file = path.resolve(__dirname, f);
            if (fs.existsSync(file)) Object.assign(process.env, parse(fs.readFileSync(file)));
          }
          const mod = await server.ssrLoadModule(`/netlify/functions/${m[1]}.mts`);
          const response: Response = await mod.default(new Request('http://localhost' + req.url, { method: req.method }));
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(await response.text());
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'dev-helper', message: String(e?.message || e) }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), rossDevHelper()],
    resolve: {
      alias: {
        '@/components': path.resolve(__dirname, 'src/components'),
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // Share the preview on the home Wi-Fi so a phone can open it
      // (http://<Mac's IP address>:3000). Local testing only.
      host: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
