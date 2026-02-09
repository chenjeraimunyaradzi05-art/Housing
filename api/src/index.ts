import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './config';
import routes from './routes';
import { standardLimiter } from './middleware';
import { initSentry, getSentryErrorHandler } from './lib/sentry';

// Initialize Sentry (must be called before other imports that might throw)
initSentry();

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(standardLimiter);

// Request logging
app.use(morgan(config.isDevelopment ? 'dev' : 'combined'));

// Cookie parsing (for refresh tokens)
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount routes
app.use(routes);

// Legacy health check (keeping for backwards compatibility)
app.get('/health', async (req: Request, res: Response) => {
  try {
    const prisma = (await import('./lib/prisma')).default;
    const { isRedisHealthy } = await import('./lib/redis');

    // Check database
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    // Check Redis
    let redisStatus = 'disconnected';
    try {
      const redisOk = await isRedisHealthy();
      redisStatus = redisOk ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: config.env,
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    });
  }
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to VÖR API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Sentry error handler (must be before other error handlers)
app.use(getSentryErrorHandler());

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);

  // Don't expose internal errors in production
  const message = config.isDevelopment
    ? err.message
    : 'An unexpected error occurred';

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`
  🚀 VÖR API Server running!

  📍 Local:      http://localhost:${config.port}
  📍 Health:     http://localhost:${config.port}/health
  📍 API:        http://localhost:${config.port}/api

  🌍 Environment: ${config.env}
  `);
});

export default app;
