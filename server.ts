import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './server/routes.ts';
import { initScheduler } from './server/scheduler.ts';

import fs from 'fs';

dotenv.config();

const app = express();
app.set('trust proxy', true);

const isProduction = process.env.NODE_ENV === 'production';

// Ensure HMR is disabled in AI Studio container environment
process.env.DISABLE_HMR = 'true';

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  if (process.env.APP_PORT) {
    const val = parseInt(process.env.APP_PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  if (process.env.DEFAULT_APP_PORT) {
    const val = parseInt(process.env.DEFAULT_APP_PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  if (isProduction && process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  return 3000;
}

const PORT = resolvePort();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', apiRouter);

// Initialize Autonomous Scheduler
try {
  initScheduler();
} catch (e) {
  console.warn('Scheduler initialization warning:', e);
}

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
      ws: false,
      watch: null,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  // SPA fallback in development: transforms index.html with Vite
  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    try {
      const template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
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

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in server process:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection in server process:', reason);
});
