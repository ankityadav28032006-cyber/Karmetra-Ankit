import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allowed origins in production & development
  const allowedOrigins = [
    'https://karmetra.in',
    'https://www.karmetra.in',
    'https://job.karmetra.in',
    'https://recruiter.karmetra.in',
    'https://employer.karmetra.in',
    'https://admin.karmetra.in',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  // Configured production CORS with credentials support
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
      if (!origin) return callback(null, true);
      
      // Check if origin matches allowed list or is a subdomain of karmetra.in
      const isKarmetraDomain = /^https:\/\/([a-zA-Z0-9-]+\.)?karmetra\.in$/.test(origin);
      const isCloudRunOrLocal = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('.run.app');

      if (allowedOrigins.includes(origin) || isKarmetraDomain || isCloudRunOrLocal) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by KarMetra Production CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads serving
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Mount Unified REST API routes
  app.use('/api', apiRouter);

  // Health check and Domain Topology endpoint
  app.get('/api/health', (req, res) => {
    const host = req.get('host') || 'unknown';
    res.json({
      status: 'ok',
      platform: 'KarMetra Enterprise Platform',
      version: '1.0.0',
      host,
      timestamp: new Date().toISOString(),
      domains: {
        main: 'https://karmetra.in',
        candidate: 'https://job.karmetra.in',
        recruiter: 'https://recruiter.karmetra.in',
        admin: 'https://admin.karmetra.in'
      },
      helpline: '9049217304',
      headOffice: 'KarMetra Enterprise Hub, BKC, Mumbai, Maharashtra 400051'
    });
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  KARMETRA PRODUCTION DEPLOYMENT ACTIVE`);
    console.log(`  Port: ${PORT} | Host: 0.0.0.0`);
    console.log(`  1. Main Web:       https://karmetra.in`);
    console.log(`  2. Candidate App:  https://job.karmetra.in`);
    console.log(`  3. Recruiter App:  https://recruiter.karmetra.in`);
    console.log(`  4. Admin Panel:    https://admin.karmetra.in`);
    console.log(`  Helpline:          9049217304 (Mumbai Head Office)`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
