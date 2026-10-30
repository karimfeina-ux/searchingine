import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './server/routes.ts';
import { initScheduler } from './server/scheduler.ts';

import fs from 'fs';

dotenv.config();

const app = express();
app.set('trust proxy', true);

const PORT = Number(process.env.APP_PORT || process.env.DEFAULT_APP_PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Ensure HMR is disabled in AI Studio container environment
process.env.DISABLE_HMR = 'true';

app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Initialize Autonomous Scheduler
initScheduler();

let viteInstance: any = null;
let viteMiddleware: any = null;

if (!isProduction) {
  // Delegate front-end requests to Vite middleware
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    if (viteMiddleware) {
      return viteMiddleware(req, res, next);
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (viteMiddleware) {
        clearInterval(interval);
        return viteMiddleware(req, res, next);
      }
      if (Date.now() - start > 10000) {
        clearInterval(interval);
        return res.status(503).send('Development server is starting, please reload in a moment...');
      }
    }, 50);
  });

  // SPA fallback in development: transforms index.html with Vite
  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    try {
      const template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
      if (viteInstance) {
        const html = await viteInstance.transformIndexHtml(req.originalUrl, template);
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      next(e);
    }
  });
} else {
  const distPath = path.resolve('dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`LeadHunter AI running on http://0.0.0.0:${PORT}`);

  if (!isProduction) {
    (async () => {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
          },
          appType: 'spa',
        });
        viteInstance = vite;
        viteMiddleware = vite.middlewares;
        console.log('Vite middleware mounted successfully.');
      } catch (err) {
        console.error('Failed to create Vite server:', err);
      }
    })();
  }
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Exiting cleanly...`);
    process.exit(1);
  } else {
    console.error('Server encountered an error:', err);
    process.exit(1);
  }
});

const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}, closing HTTP server on port ${PORT}...`);
  server.close(() => {
    console.log('Server closed successfully.');
    process.exit(0);
  });
  setTimeout(() => {
    process.exit(0);
  }, 2000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
