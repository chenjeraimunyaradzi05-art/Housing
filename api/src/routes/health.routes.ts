import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });
  }
});

/**
 * @route   GET /health/live
 * @desc    Liveness probe (is the server running?)
 * @access  Public
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe (is the server ready to accept traffic?)
 * @access  Public
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;
