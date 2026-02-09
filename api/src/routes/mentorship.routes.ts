import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { matchMentors, calculateProgress, suggestSessionTopics } from '../lib/mentorship';

const router = Router();

/**
 * GET /api/mentorship/mentors
 * List available mentors with optional filters
 */
router.get('/mentors', authenticate, async (req: Request, res: Response) => {
  try {
    const { expertise, availability, minRating } = req.query;

    // Mock mentor data - in production would query MentorProfile table
    const mentors = [
      {
        id: 'mentor-1',
        userId: 'user-m1',
        name: 'Dr. Angela Foster',
        headline: 'Real Estate Investment Strategist | 15+ Years Experience',
        expertise: ['real_estate', 'investing', 'wealth_building'],
        yearsExperience: 15,
        availability: 'available',
        maxMentees: 5,
        currentMentees: 3,
        rating: 4.9,
        totalReviews: 47,
        totalSessions: 234,
        languages: ['en', 'es'],
        verified: true,
        bio: 'Helping women build generational wealth through strategic real estate investing.',
      },
      {
        id: 'mentor-2',
        userId: 'user-m2',
        name: 'Sarah Kim, CPA',
        headline: 'Tax Optimization Expert for Real Estate Investors',
        expertise: ['tax', 'financing', 'investing'],
        yearsExperience: 10,
        availability: 'available',
        maxMentees: 3,
        currentMentees: 1,
        rating: 4.8,
        totalReviews: 32,
        totalSessions: 156,
        languages: ['en', 'ko'],
        verified: true,
        bio: 'Specializing in tax strategies that maximize returns for women real estate investors.',
      },
      {
        id: 'mentor-3',
        userId: 'user-m3',
        name: 'Maria Rodriguez',
        headline: 'First-Time Homebuyer Advocate & Coach',
        expertise: ['first_time_buyer', 'negotiation', 'property_analysis'],
        yearsExperience: 8,
        availability: 'limited',
        maxMentees: 4,
        currentMentees: 4,
        rating: 4.7,
        totalReviews: 28,
        totalSessions: 112,
        languages: ['en', 'es'],
        verified: true,
        bio: 'Guiding first-time buyers through every step of the homebuying journey.',
      },
      {
        id: 'mentor-4',
        userId: 'user-m4',
        name: 'Latisha Williams',
        headline: 'Commercial Real Estate & Portfolio Building Expert',
        expertise: ['real_estate', 'property_analysis', 'wealth_building'],
        yearsExperience: 12,
        availability: 'available',
        maxMentees: 3,
        currentMentees: 1,
        rating: 4.85,
        totalReviews: 39,
        totalSessions: 189,
        languages: ['en'],
        verified: true,
        bio: 'Building portfolios that create lasting wealth for women and their families.',
      },
    ];

    let filtered = mentors;
    if (expertise) {
      const expertiseArr = (expertise as string).split(',');
      filtered = filtered.filter(m =>
        m.expertise.some(e => expertiseArr.includes(e))
      );
    }
    if (availability) {
      filtered = filtered.filter(m => m.availability === availability);
    }
    if (minRating) {
      filtered = filtered.filter(m => m.rating >= Number(minRating));
    }

    res.json({ mentors: filtered, total: filtered.length });
  } catch {
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

/**
 * GET /api/mentorship/match
 * Get AI-powered mentor recommendations for the current user
 */
router.get('/match', authenticate, async (req: Request, res: Response) => {
  try {
    const { goals, focusAreas } = req.query;
    const goalsArr = goals ? (goals as string).split(',') : ['investing'];
    const focusArr = focusAreas ? (focusAreas as string).split(',') : ['real_estate'];

    const availableMentors = [
      { id: 'mentor-1', expertise: ['real_estate', 'investing', 'wealth_building'], availability: 'available', currentMentees: 3, maxMentees: 5, rating: 4.9, totalSessions: 234 },
      { id: 'mentor-2', expertise: ['tax', 'financing', 'investing'], availability: 'available', currentMentees: 1, maxMentees: 3, rating: 4.8, totalSessions: 156 },
      { id: 'mentor-3', expertise: ['first_time_buyer', 'negotiation', 'property_analysis'], availability: 'limited', currentMentees: 4, maxMentees: 4, rating: 4.7, totalSessions: 112 },
      { id: 'mentor-4', expertise: ['real_estate', 'property_analysis', 'wealth_building'], availability: 'available', currentMentees: 1, maxMentees: 3, rating: 4.85, totalSessions: 189 },
    ];

    const matches = matchMentors(goalsArr, focusArr, availableMentors);

    res.json({ matches, totalMatches: matches.length });
  } catch {
    res.status(500).json({ error: 'Failed to match mentors' });
  }
});

/**
 * POST /api/mentorship/request
 * Request a mentorship with a specific mentor
 */
router.post('/request', authenticate, async (req: Request, res: Response) => {
  try {
    const { mentorId, programType, goals, focusAreas } = req.body;

    if (!mentorId || !programType || !goals) {
      return res.status(400).json({ error: 'mentorId, programType, and goals are required' });
    }

    const mentorship = {
      id: `mentorship-${Date.now()}`,
      mentorId,
      menteeUserId: req.user!.id,
      programType,
      status: 'pending',
      goals,
      focusAreas: focusAreas || [],
      startDate: null,
      endDate: null,
      milestones: [],
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({ mentorship, message: 'Mentorship request submitted. The mentor will review and accept shortly.' });
  } catch {
    res.status(500).json({ error: 'Failed to submit mentorship request' });
  }
});

/**
 * GET /api/mentorship/my-mentorships
 * Get the current user's active mentorships (as mentee or mentor)
 */
router.get('/my-mentorships', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Mock active mentorships
    const mentorships = [
      {
        id: 'ms-1',
        mentorId: 'mentor-1',
        mentorName: 'Dr. Angela Foster',
        menteeUserId: userId,
        programType: '6_month',
        status: 'active',
        goals: ['Build first rental portfolio', 'Understand market analysis', 'Create investment strategy'],
        focusAreas: ['real_estate', 'investing'],
        startDate: '2026-01-15',
        endDate: '2026-07-15',
        milestones: ['Completed market analysis training', 'Identified target neighborhoods'],
        sessionsCompleted: 8,
        nextSession: '2026-02-12T14:00:00Z',
        progress: calculateProgress(
          ['Completed market analysis training', 'Identified target neighborhoods'],
          3,
          8,
          '6_month'
        ),
      },
    ];

    res.json({ mentorships });
  } catch {
    res.status(500).json({ error: 'Failed to fetch mentorships' });
  }
});

/**
 * GET /api/mentorship/sessions
 * Get upcoming and past mentorship sessions
 */
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const sessions = [
      {
        id: 'sess-1',
        mentorshipId: 'ms-1',
        mentorName: 'Dr. Angela Foster',
        scheduledAt: '2026-02-12T14:00:00Z',
        durationMinutes: 45,
        type: 'video',
        status: 'scheduled',
        topic: 'Investment Property Due Diligence Checklist',
        meetingUrl: 'https://meet.vor-platform.com/sess-1',
      },
      {
        id: 'sess-2',
        mentorshipId: 'ms-1',
        mentorName: 'Dr. Angela Foster',
        scheduledAt: '2026-02-05T14:00:00Z',
        durationMinutes: 45,
        type: 'video',
        status: 'completed',
        topic: 'Analyzing Rental Market Trends',
        notes: 'Covered local market data sources, cap rate benchmarks, and rental demand indicators.',
      },
      {
        id: 'sess-3',
        mentorshipId: 'ms-1',
        mentorName: 'Dr. Angela Foster',
        scheduledAt: '2026-01-29T14:00:00Z',
        durationMinutes: 30,
        type: 'video',
        status: 'completed',
        topic: 'Setting Investment Goals & Strategy',
        notes: 'Defined 6-month goals, agreed on focus areas, and set weekly milestones.',
      },
    ];

    res.json({ sessions });
  } catch {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * POST /api/mentorship/sessions
 * Schedule a new mentorship session
 */
router.post('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const { mentorshipId, scheduledAt, durationMinutes, type, topic } = req.body;

    if (!mentorshipId || !scheduledAt) {
      return res.status(400).json({ error: 'mentorshipId and scheduledAt are required' });
    }

    const session = {
      id: `sess-${Date.now()}`,
      mentorshipId,
      scheduledAt,
      durationMinutes: durationMinutes || 30,
      type: type || 'video',
      status: 'scheduled',
      topic: topic || '',
      meetingUrl: `https://meet.vor-platform.com/sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({ session });
  } catch {
    res.status(500).json({ error: 'Failed to schedule session' });
  }
});

/**
 * GET /api/mentorship/topics
 * Get suggested session topics based on goals and progress
 */
router.get('/topics', authenticate, async (req: Request, res: Response) => {
  try {
    const { goals, completedTopics, focusAreas } = req.query;
    const goalsArr = goals ? (goals as string).split(',') : ['real_estate'];
    const completedArr = completedTopics ? (completedTopics as string).split(',') : [];
    const focusArr = focusAreas ? (focusAreas as string).split(',') : [];

    const suggestions = suggestSessionTopics(goalsArr, completedArr, focusArr);

    res.json({ suggestedTopics: suggestions });
  } catch {
    res.status(500).json({ error: 'Failed to get topic suggestions' });
  }
});

/**
 * POST /api/mentorship/check-in
 * Submit a progress check-in
 */
router.post('/check-in', authenticate, async (req: Request, res: Response) => {
  try {
    const { mentorshipId, type, content, goalsProgress, challenges, nextSteps } = req.body;

    if (!mentorshipId || !content) {
      return res.status(400).json({ error: 'mentorshipId and content are required' });
    }

    const checkIn = {
      id: `checkin-${Date.now()}`,
      mentorshipId,
      submittedBy: req.user!.id,
      type: type || 'weekly',
      content,
      goalsProgress: goalsProgress || null,
      challenges: challenges || null,
      nextSteps: nextSteps || null,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({ checkIn, message: 'Check-in submitted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to submit check-in' });
  }
});

export default router;
