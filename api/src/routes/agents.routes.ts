/**
 * Agent Routes - API endpoints for Agent & Partner Ecosystem
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  registerAgent,
  generateReferralCode,
  processReferral,
  calculateTier,
  getAgentPerformance,
  getLeaderboard,
  requestPayout,
} from '../lib/agents';

const router = Router();

// Register as an agent
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { specializations, regions } = req.body;
    const agent = await registerAgent(userId, { specializations, regions });
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Generate referral code
router.post('/referral-code', authenticate, async (req: Request, res: Response) => {
  try {
    const { agentId, type, discount, maxUses, expiresInDays } = req.body;
    const code = generateReferralCode(agentId, {
      type,
      discount,
      maxUses,
      expiresInDays,
    });
    res.status(201).json(code);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Process referral
router.post('/referral/process', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { referralCode, investmentAmount } = req.body;
    const result = await processReferral(referralCode, userId, investmentAmount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get tier information
router.get('/tier/:referralCount', authenticate, async (req: Request, res: Response) => {
  try {
    const referralCount = parseInt(req.params.referralCount as string, 10);
    const tierInfo = calculateTier(referralCount);
    res.json(tierInfo);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get agent performance
router.get('/performance/:agentId', authenticate, async (req: Request, res: Response) => {
  try {
    const agentId = req.params.agentId as string;
    // Mock agent for demo
    const mockAgent = {
      id: agentId,
      userId: 'user-123',
      tier: 'silver' as const,
      status: 'active' as const,
      commissionRate: 0.03,
      totalEarnings: 1500,
      referralCount: 15,
      joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      specializations: ['residential'],
      regions: ['California'],
      verificationStatus: 'verified' as const,
      performanceScore: 75,
    };

    const performance = getAgentPerformance(mockAgent);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticate, async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string || 'month') as 'week' | 'month' | 'quarter' | 'year' | 'all';
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const leaderboard = getLeaderboard(period, limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Request payout
router.post('/payout', authenticate, async (req: Request, res: Response) => {
  try {
    const { agentId, amount, payoutMethod } = req.body;
    const result = await requestPayout(agentId, amount, payoutMethod);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/agents/directory
 * Public agent directory - no auth required
 */
router.get('/directory', async (req: Request, res: Response) => {
  try {
    const { specialization, region, search, page, limit } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    // Mock agent directory data
    let agents = [
      {
        id: 'agent-1',
        name: 'Jessica Martinez',
        title: 'Licensed Real Estate Agent',
        specializations: ['residential', 'first_time_buyer'],
        regions: ['California', 'Nevada'],
        rating: 4.9,
        reviewCount: 68,
        dealsCompleted: 142,
        yearsExperience: 12,
        languages: ['English', 'Spanish'],
        verified: true,
        avatar: null,
        bio: 'Passionate about helping first-time buyers find their dream homes.',
      },
      {
        id: 'agent-2',
        name: 'Tamika Johnson',
        title: 'Investment Property Specialist',
        specializations: ['investment', 'commercial', 'multi_family'],
        regions: ['Georgia', 'Florida', 'Texas'],
        rating: 4.85,
        reviewCount: 53,
        dealsCompleted: 98,
        yearsExperience: 9,
        languages: ['English'],
        verified: true,
        avatar: null,
        bio: 'Specializing in multi-family and commercial investment properties.',
      },
      {
        id: 'agent-3',
        name: 'Priya Patel',
        title: 'Luxury & Relocation Specialist',
        specializations: ['luxury', 'relocation'],
        regions: ['New York', 'New Jersey', 'Connecticut'],
        rating: 4.95,
        reviewCount: 41,
        dealsCompleted: 76,
        yearsExperience: 15,
        languages: ['English', 'Hindi', 'Gujarati'],
        verified: true,
        avatar: null,
        bio: 'Luxury market expert with a focus on seamless relocations.',
      },
      {
        id: 'agent-4',
        name: 'Rachel Kim',
        title: 'Foreclosure & Short Sale Expert',
        specializations: ['foreclosure', 'short_sale', 'investment'],
        regions: ['Washington', 'Oregon'],
        rating: 4.7,
        reviewCount: 37,
        dealsCompleted: 85,
        yearsExperience: 7,
        languages: ['English', 'Korean'],
        verified: true,
        avatar: null,
        bio: 'Finding hidden value in distressed properties for savvy investors.',
      },
    ];

    // Apply filters
    if (specialization) {
      agents = agents.filter(a =>
        a.specializations.some(s => s.toLowerCase().includes((specialization as string).toLowerCase()))
      );
    }
    if (region) {
      agents = agents.filter(a =>
        a.regions.some(r => r.toLowerCase().includes((region as string).toLowerCase()))
      );
    }
    if (search) {
      const q = (search as string).toLowerCase();
      agents = agents.filter(a =>
        a.name.toLowerCase().includes(q) || a.bio.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
      );
    }

    const total = agents.length;
    const start = (pageNum - 1) * limitNum;
    const paginated = agents.slice(start, start + limitNum);

    res.json({
      agents: paginated,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent directory' });
  }
});

/**
 * GET /api/agents/lenders
 * Public lender directory
 */
router.get('/lenders', async (req: Request, res: Response) => {
  try {
    const { type, state } = req.query;

    let lenders = [
      {
        id: 'lender-1',
        name: 'HomeFirst Mortgage',
        type: 'bank',
        description: 'Competitive rates for first-time buyers with down payment assistance programs.',
        rates: { thirtyYear: 6.25, fifteenYear: 5.75, arm: 5.5 },
        minCreditScore: 620,
        minDownPayment: 3,
        specialPrograms: ['FHA', 'VA', 'USDA', 'First-Time Buyer'],
        states: ['All US States'],
        rating: 4.6,
        reviewCount: 234,
        verified: true,
        contactUrl: 'https://homefirst.example.com',
      },
      {
        id: 'lender-2',
        name: 'EmpowerLend Credit Union',
        type: 'credit_union',
        description: 'Community-focused lending with personalized service and flexible terms.',
        rates: { thirtyYear: 6.0, fifteenYear: 5.5, arm: 5.25 },
        minCreditScore: 580,
        minDownPayment: 3.5,
        specialPrograms: ['FHA', 'Community Development', 'Low-Income Assistance'],
        states: ['California', 'Oregon', 'Washington', 'Nevada'],
        rating: 4.8,
        reviewCount: 156,
        verified: true,
        contactUrl: 'https://empowerlend.example.com',
      },
      {
        id: 'lender-3',
        name: 'InvestorCapital Finance',
        type: 'private',
        description: 'Hard money and bridge loans for real estate investors. Fast closings.',
        rates: { thirtyYear: null, fifteenYear: null, arm: 8.5 },
        minCreditScore: 660,
        minDownPayment: 20,
        specialPrograms: ['Bridge Loans', 'Fix & Flip', 'DSCR', 'Portfolio Loans'],
        states: ['All US States'],
        rating: 4.3,
        reviewCount: 89,
        verified: true,
        contactUrl: 'https://investorcapital.example.com',
      },
      {
        id: 'lender-4',
        name: 'SecureHome Bank',
        type: 'bank',
        description: 'Dedicated to making homeownership accessible for underserved communities.',
        rates: { thirtyYear: 6.1, fifteenYear: 5.6, arm: 5.35 },
        minCreditScore: 600,
        minDownPayment: 3,
        specialPrograms: ['FHA', 'HUD', 'Down Payment Assistance', 'Minority Homeownership'],
        states: ['Texas', 'Georgia', 'Florida', 'North Carolina', 'Virginia'],
        rating: 4.7,
        reviewCount: 178,
        verified: true,
        contactUrl: 'https://securehome.example.com',
      },
    ];

    if (type) {
      lenders = lenders.filter(l => l.type === type);
    }
    if (state) {
      lenders = lenders.filter(l =>
        l.states.includes('All US States') || l.states.some(s => s.toLowerCase().includes((state as string).toLowerCase()))
      );
    }

    res.json({ lenders, total: lenders.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lenders' });
  }
});

/**
 * GET /api/agents/partners
 * Public partner directory (title companies, inspectors, etc.)
 */
router.get('/partners', async (req: Request, res: Response) => {
  try {
    const { category, region } = req.query;

    let partners = [
      {
        id: 'partner-1',
        name: 'ClearTitle Services',
        category: 'title_company',
        description: 'Fast, reliable title searches and closing services.',
        services: ['Title Search', 'Title Insurance', 'Escrow', 'Closing Coordination'],
        regions: ['California', 'Nevada', 'Arizona'],
        rating: 4.8,
        reviewCount: 112,
        verified: true,
        contactEmail: 'info@cleartitle.example.com',
        website: 'https://cleartitle.example.com',
      },
      {
        id: 'partner-2',
        name: 'SafeCheck Home Inspections',
        category: 'inspector',
        description: 'Comprehensive home inspections with detailed reports within 24 hours.',
        services: ['General Inspection', 'Mold Testing', 'Radon Testing', 'Pest Inspection', 'Structural Assessment'],
        regions: ['Texas', 'Oklahoma', 'Louisiana'],
        rating: 4.9,
        reviewCount: 87,
        verified: true,
        contactEmail: 'book@safecheck.example.com',
        website: 'https://safecheck.example.com',
      },
      {
        id: 'partner-3',
        name: 'RealValue Appraisals',
        category: 'appraiser',
        description: 'Licensed appraisers with fast turnaround for residential and commercial properties.',
        services: ['Residential Appraisal', 'Commercial Appraisal', 'FHA Appraisal', 'Desktop Appraisal'],
        regions: ['New York', 'New Jersey', 'Pennsylvania', 'Connecticut'],
        rating: 4.6,
        reviewCount: 63,
        verified: true,
        contactEmail: 'appraisals@realvalue.example.com',
        website: 'https://realvalue.example.com',
      },
      {
        id: 'partner-4',
        name: 'WomenBuild Contractors',
        category: 'contractor',
        description: 'Women-owned general contracting firm specializing in renovation and new construction.',
        services: ['Kitchen Remodel', 'Bathroom Remodel', 'Full Renovation', 'New Construction', 'ADU Construction'],
        regions: ['Georgia', 'Florida', 'Alabama'],
        rating: 4.85,
        reviewCount: 94,
        verified: true,
        contactEmail: 'hello@womenbuild.example.com',
        website: 'https://womenbuild.example.com',
      },
      {
        id: 'partner-5',
        name: 'PropInsure Insurance Group',
        category: 'insurance',
        description: 'Affordable homeowner and landlord insurance with bundled property packages.',
        services: ['Homeowner Insurance', 'Landlord Insurance', 'Umbrella Policy', 'Flood Insurance'],
        regions: ['All US States'],
        rating: 4.5,
        reviewCount: 201,
        verified: true,
        contactEmail: 'quotes@propinsure.example.com',
        website: 'https://propinsure.example.com',
      },
    ];

    if (category) {
      partners = partners.filter(p => p.category === category);
    }
    if (region) {
      const r = (region as string).toLowerCase();
      partners = partners.filter(p =>
        p.regions.includes('All US States') || p.regions.some(reg => reg.toLowerCase().includes(r))
      );
    }

    res.json({ partners, total: partners.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

export default router;
