/**
 * Streaming Routes - API endpoints for Content & Streaming
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getContentById,
  searchContent,
  getRecommendedContent,
  getUpcomingStreams,
  getCourseCatalog,
  trackEngagement,
  updateProgress,
  getUserProgress,
} from '../lib/streaming';

const router = Router();

// Get single content item
router.get('/content/:contentId', authenticate, async (req: Request, res: Response) => {
  try {
    const contentId = req.params.contentId as string;
    const content = getContentById(contentId);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Search content
router.get('/content', authenticate, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    const type = req.query.type as string | undefined;
    const premium = req.query.premium as string | undefined;
    const tags = req.query.tags as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const limit = req.query.limit as string | undefined;
    const offset = req.query.offset as string | undefined;

    const results = searchContent({
      query,
      category: category as any,
      type: type as any,
      premium: premium ? premium === 'true' : undefined,
      tags: tags ? tags.split(',') : undefined,
      sortBy: (sortBy as 'recent' | 'popular' | 'rating') || 'recent',
      limit: limit ? parseInt(limit, 10) : 10,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get recommended content
router.get('/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const limit = parseInt(req.query.limit as string, 10) || 5;

    // Mock user interests (would come from profile)
    const userInterests = ['beginner', 'investing_basics', 'market_analysis'];

    const recommendations = getRecommendedContent(userId, userInterests, limit);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get upcoming live streams
router.get('/streams/upcoming', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 5;

    const streams = getUpcomingStreams(limit);
    res.json({ streams });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get course catalog
router.get('/courses', authenticate, async (req: Request, res: Response) => {
  try {
    const courses = getCourseCatalog();
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get single course
router.get('/courses/:courseId', authenticate, async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const courses = getCourseCatalog();
    const course = courses.find((c) => c.id === courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Track engagement
router.post('/engagement', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { contentId, action } = req.body;

    await trackEngagement(userId, contentId, action);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Update progress
router.post('/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { contentId, progress, type } = req.body;

    const result = await updateProgress(userId, contentId, progress, type);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get user progress
router.get('/progress', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const contentIds = req.query.contentIds as string | undefined;

    const progress = await getUserProgress(
      userId,
      contentIds ? contentIds.split(',') : undefined
    );

    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
