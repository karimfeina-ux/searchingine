import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './server/routes.ts';
import { initScheduler } from './server/scheduler.ts';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Initialize Autonomous Scheduler
initScheduler();

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadHunter AI running on http://localhost:${PORT}`);

    // Check if initial seed is needed (background, non-blocking)
    (async () => {
      try {
        const { getProspects } = await import('./server/db.ts');
        const { runProspectDiscovery } = await import('./server/researchEngine.ts');
        if (getProspects().total === 0) {
          console.log('Fresh installation detected: seeding initial verified prospects for target territory...');
          await runProspectDiscovery('manual');
        }
      } catch (err) {
        console.error('Initial discovery check notice:', err);
      }
    })();
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
