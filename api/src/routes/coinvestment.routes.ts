import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticate, requireRoles } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { slugify } from '../utils';
import {
  createPoolSchema,
  updatePoolSchema,
  getPoolSchema,
  listPoolsSchema,
  investInPoolSchema,
  createDistributionSchema,
  getUserInvestmentsSchema,
  getDistributionsSchema,
  cancelInvestmentSchema,
  cancelPoolSchema,
  processDistributionPayoutSchema,
  type CreatePoolInput,
} from '../schemas/coinvestment.schema';
import {
  createPaymentIntent,
  dollarsToCents,
  cancelPaymentIntent,
  createRefund,
} from '../lib/stripe';
import { Prisma } from '@prisma/client';

const router = Router();

// ==================== PUBLIC ENDPOINTS ====================

/**
 * GET /co-invest/pools
 * List all open investment pools with filtering & pagination
 */
router.get('/pools', validate(listPoolsSchema), async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const riskLevel = typeof req.query.riskLevel === 'string' ? req.query.riskLevel : undefined;
    const investmentType = typeof req.query.investmentType === 'string' ? req.query.investmentType : undefined;
    const location = typeof req.query.location === 'string' ? req.query.location : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 12;
    const sortBy = (typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt') as string;
    const sortOrder = (typeof req.query.sortOrder === 'string' ? req.query.sortOrder : 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: Prisma.CoInvestmentPoolWhereInput = {};

    if (status) {
      where.status = status;
    } else {
      // Default: show only pools open to investment
      where.status = { in: ['seeking', 'active'] };
    }

    if (riskLevel) where.riskLevel = riskLevel;
    if (investmentType) where.investmentType = investmentType;
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Paginate
    const skip = (page - 1) * limit;

    const [pools, total] = await Promise.all([
      prisma.coInvestmentPool.findMany({
        where,
        include: {
          _count: { select: { investors: true } },
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.coInvestmentPool.count({ where }),
    ]);

    // Transform data for frontend
    const transformed = pools.map((pool) => ({
      ...pool,
      investorCount: pool._count.investors,
      fundingProgress: pool.targetAmount.toNumber() > 0
        ? (pool.raisedAmount.toNumber() / pool.targetAmount.toNumber()) * 100
        : 0,
      targetAmount: pool.targetAmount.toNumber(),
      raisedAmount: pool.raisedAmount.toNumber(),
      minInvestment: pool.minInvestment.toNumber(),
      maxInvestment: pool.maxInvestment?.toNumber() || null,
      sharePrice: pool.sharePrice.toNumber(),
      expectedReturn: pool.expectedReturn?.toNumber() || null,
      managementFee: pool.managementFee.toNumber(),
    }));

    sendSuccess(res, transformed, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('List pools error:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to fetch pools', 500);
  }
});

/**
 * GET /co-invest/pools/:id
 * Get pool details by ID or slug
 */
router.get('/pools/:id', validate(getPoolSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Try to find by ID first, then by slug
    const pool = await prisma.coInvestmentPool.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: { select: { investors: true } },
      },
    });

    if (!pool) {
      return sendError(res, 'NOT_FOUND', 'Pool not found', 404);
    }

    // Transform decimal fields
    const transformed = {
      ...pool,
      investorCount: pool._count.investors,
      fundingProgress: pool.targetAmount.toNumber() > 0
        ? (pool.raisedAmount.toNumber() / pool.targetAmount.toNumber()) * 100
        : 0,
      targetAmount: pool.targetAmount.toNumber(),
      raisedAmount: pool.raisedAmount.toNumber(),
      minInvestment: pool.minInvestment.toNumber(),
      maxInvestment: pool.maxInvestment?.toNumber() || null,
      sharePrice: pool.sharePrice.toNumber(),
      expectedReturn: pool.expectedReturn?.toNumber() || null,
      managementFee: pool.managementFee.toNumber(),
    };

    sendSuccess(res, transformed);
  } catch (error) {
    console.error('Get pool error:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to fetch pool', 500);
  }
});

// ==================== AUTHENTICATED ENDPOINTS ====================

/**
 * POST /co-invest/pools
 * Create a new investment pool (admin/landlord only)
 */
router.post(
  '/pools',
  authenticate,
  requireRoles(['admin', 'landlord']),
  validate(createPoolSchema),
  async (req: Request, res: Response) => {
    try {
      const input: CreatePoolInput = req.body;
      const userId = req.user!.id;

      // Generate slug from name
      let slug = slugify(input.name);

      // Check for existing slug and make unique if needed
      const existingSlug = await prisma.coInvestmentPool.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      const pool = await prisma.coInvestmentPool.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          propertyId: input.propertyId,
          targetAmount: input.targetAmount,
          minInvestment: input.minInvestment,
          maxInvestment: input.maxInvestment,
          sharePrice: input.sharePrice,
          totalShares: input.totalShares,
          availableShares: input.totalShares,
          expectedReturn: input.expectedReturn,
          holdPeriod: input.holdPeriod,
          distributionFrequency: input.distributionFrequency,
          startDate: input.startDate ? new Date(input.startDate) : null,
          fundingDeadline: input.fundingDeadline ? new Date(input.fundingDeadline) : null,
          managerId: userId,
          managementFee: input.managementFee,
          riskLevel: input.riskLevel,
          investmentType: input.investmentType,
          propertyType: input.propertyType,
          location: input.location,
          highlights: input.highlights,
          images: input.images,
        },
      });

      sendSuccess(res, pool, 201);
    } catch (error) {
      console.error('Create pool error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to create pool', 500);
    }
  }
);

/**
 * PATCH /co-invest/pools/:id
 * Update an investment pool
 */
router.patch(
  '/pools/:id',
  authenticate,
  requireRoles(['admin', 'landlord']),
  validate(updatePoolSchema),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const updates = req.body;

      // Check pool exists and user has permission
      const pool = await prisma.coInvestmentPool.findUnique({
        where: { id },
      });

      if (!pool) {
        return sendError(res, 'NOT_FOUND', 'Pool not found', 404);
      }

      if (pool.managerId !== userId && req.user!.role !== 'admin') {
        return sendError(res, 'FORBIDDEN', 'Not authorized to update this pool', 403);
      }

      // Prevent updates to active pools with investors
      if (pool.status !== 'draft' && pool.status !== 'seeking') {
        const investorCount = await prisma.coInvestmentInvestor.count({
          where: { poolId: id },
        });
        if (investorCount > 0 && ['targetAmount', 'sharePrice', 'totalShares'].some(k => k in updates)) {
          return sendError(
            res,
            'INVALID_OPERATION',
            'Cannot modify financial terms of a pool with investors',
            400
          );
        }
      }

      // Handle date fields
      const data: Prisma.CoInvestmentPoolUpdateInput = { ...updates };
      if (updates.startDate) data.startDate = new Date(updates.startDate);
      if (updates.fundingDeadline) data.fundingDeadline = new Date(updates.fundingDeadline);

      const updated = await prisma.coInvestmentPool.update({
        where: { id },
        data,
      });

      sendSuccess(res, updated);
    } catch (error) {
      console.error('Update pool error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to update pool', 500);
    }
  }
);

/**
 * POST /co-invest/pools/:id/invest
 * Invest in a pool (creates payment intent)
 */
router.post(
  '/pools/:id/invest',
  authenticate,
  validate(investInPoolSchema),
  async (req: Request, res: Response) => {
    try {
      const poolId = req.params.id as string;
      const userId = req.user!.id;
      const { shares, agreementSigned, paymentMethodId } = req.body;

      // Get pool
      const pool = await prisma.coInvestmentPool.findUnique({
        where: { id: poolId },
      });

      if (!pool) {
        return sendError(res, 'NOT_FOUND', 'Pool not found', 404);
      }

      // Validate pool is open for investment
      if (!['seeking', 'active'].includes(pool.status)) {
        return sendError(res, 'INVALID_OPERATION', 'Pool is not accepting investments', 400);
      }

      // Check available shares
      if (shares > pool.availableShares) {
        return sendError(
          res,
          'INVALID_OPERATION',
          `Only ${pool.availableShares} shares available`,
          400
        );
      }

      // Calculate amount
      const sharePrice = pool.sharePrice.toNumber();
      const amount = shares * sharePrice;

      // Validate min/max investment
      const minInvestment = pool.minInvestment.toNumber();
      const maxInvestment = pool.maxInvestment?.toNumber();

      if (amount < minInvestment) {
        return sendError(
          res,
          'INVALID_OPERATION',
          `Minimum investment is $${minInvestment.toLocaleString()}`,
          400
        );
      }

      if (maxInvestment && amount > maxInvestment) {
        return sendError(
          res,
          'INVALID_OPERATION',
          `Maximum investment is $${maxInvestment.toLocaleString()}`,
          400
        );
      }

      // Check if user already has an investment
      const existingInvestment = await prisma.coInvestmentInvestor.findUnique({
        where: {
          poolId_userId: { poolId, userId },
        },
      });

      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount: dollarsToCents(amount),
        metadata: {
          poolId,
          userId,
          shares: shares.toString(),
          type: 'co_investment',
        },
        description: `Investment in ${pool.name}`,
        paymentMethodId,
        setupFutureUsage: 'off_session',
      });

      // Create or update investor record
      let investor;
      if (existingInvestment) {
        investor = await prisma.coInvestmentInvestor.update({
          where: { id: existingInvestment.id },
          data: {
            shares: { increment: shares },
            amountInvested: { increment: amount },
            stripePaymentId: paymentIntent.id,
            paymentStatus: 'pending',
            agreementSigned,
          },
        });
      } else {
        investor = await prisma.coInvestmentInvestor.create({
          data: {
            poolId,
            userId,
            shares,
            amountInvested: amount,
            sharePrice,
            agreementSigned,
            stripePaymentId: paymentIntent.id,
            paymentStatus: 'pending',
          },
        });
      }

      sendSuccess(res, {
        investorId: investor.id,
        clientSecret: paymentIntent.client_secret,
        amount,
        shares,
      }, 201);
    } catch (error) {
      console.error('Invest error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to process investment', 500);
    }
  }
);

/**
 * GET /co-invest/my-investments
 * Get current user's investments
 */
router.get(
  '/my-investments',
  authenticate,
  validate(getUserInvestmentsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

      const where: Prisma.CoInvestmentInvestorWhereInput = { userId };
      if (status) where.paymentStatus = status;

      const skip = (page - 1) * limit;

      const [investments, total] = await Promise.all([
        prisma.coInvestmentInvestor.findMany({
          where,
          include: {
            pool: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                expectedReturn: true,
                distributionFrequency: true,
                images: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.coInvestmentInvestor.count({ where }),
      ]);

      // Transform decimal fields
      const transformed = investments.map((inv) => ({
        ...inv,
        amountInvested: inv.amountInvested.toNumber(),
        sharePrice: inv.sharePrice.toNumber(),
        ownershipPercent: inv.ownershipPercent?.toNumber() || 0,
        pool: {
          ...inv.pool,
          expectedReturn: inv.pool.expectedReturn?.toNumber() || null,
        },
      }));

      sendSuccess(res, transformed, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Get investments error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to fetch investments', 500);
    }
  }
);

/**
 * GET /co-invest/pools/:poolId/distributions
 * Get distributions for a pool (investor or manager)
 */
router.get(
  '/pools/:poolId/distributions',
  authenticate,
  validate(getDistributionsSchema),
  async (req: Request, res: Response) => {
    try {
      const poolId = req.params.poolId as string;
      const userId = req.user!.id;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

      // Check user has access (investor or manager)
      const [isInvestor, pool] = await Promise.all([
        prisma.coInvestmentInvestor.findUnique({
          where: { poolId_userId: { poolId, userId } },
        }),
        prisma.coInvestmentPool.findUnique({
          where: { id: poolId },
          select: { managerId: true },
        }),
      ]);

      if (!isInvestor && pool?.managerId !== userId && req.user!.role !== 'admin') {
        return sendError(res, 'FORBIDDEN', 'Not authorized to view distributions', 403);
      }

      const where: Prisma.CoInvestmentDistributionWhereInput = { poolId };

      // If not manager/admin, only show user's distributions
      if (isInvestor && pool?.managerId !== userId && req.user!.role !== 'admin') {
        where.investorId = isInvestor.id;
      }

      if (status) where.status = status;

      const skip = (page - 1) * limit;

      const [distributions, total] = await Promise.all([
        prisma.coInvestmentDistribution.findMany({
          where,
          include: {
            investor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.coInvestmentDistribution.count({ where }),
      ]);

      // Transform decimal fields
      const transformed = distributions.map((dist) => ({
        ...dist,
        grossAmount: dist.grossAmount.toNumber(),
        fees: dist.fees.toNumber(),
        taxes: dist.taxes.toNumber(),
        netAmount: dist.netAmount.toNumber(),
      }));

      sendSuccess(res, transformed, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Get distributions error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to fetch distributions', 500);
    }
  }
);

/**
 * POST /co-invest/pools/:poolId/distributions
 * Create distributions for all investors (manager only)
 */
router.post(
  '/pools/:poolId/distributions',
  authenticate,
  requireRoles(['admin', 'landlord']),
  validate(createDistributionSchema),
  async (req: Request, res: Response) => {
    try {
      const poolId = req.params.poolId as string;
      const userId = req.user!.id;
      const { type, period, grossAmount, fees, taxes, notes } = req.body;

      // Check pool exists and user is manager
      const pool = await prisma.coInvestmentPool.findUnique({
        where: { id: poolId },
        include: {
          investors: {
            where: { paymentStatus: 'completed' },
          },
        },
      });

      if (!pool) {
        return sendError(res, 'NOT_FOUND', 'Pool not found', 404);
      }

      if (pool.managerId !== userId && req.user!.role !== 'admin') {
        return sendError(res, 'FORBIDDEN', 'Not authorized to create distributions', 403);
      }

      if (pool.investors.length === 0) {
        return sendError(res, 'INVALID_OPERATION', 'No confirmed investors in this pool', 400);
      }

      // Calculate distribution for each investor based on ownership
      const distributions = await prisma.$transaction(
        pool.investors.map((investor) => {
          const ownershipPercent = investor.ownershipPercent?.toNumber() || 0;
          const investorGross = (grossAmount * ownershipPercent) / 100;
          const investorFees = (fees * ownershipPercent) / 100;
          const investorTaxes = (taxes * ownershipPercent) / 100;
          const netAmount = investorGross - investorFees - investorTaxes;

          return prisma.coInvestmentDistribution.create({
            data: {
              poolId,
              investorId: investor.id,
              type,
              period,
              grossAmount: investorGross,
              fees: investorFees,
              taxes: investorTaxes,
              netAmount,
              notes,
              status: 'pending',
            },
          });
        })
      );

      sendSuccess(res, {
        distributionsCreated: distributions.length,
        totalGrossAmount: grossAmount,
        totalNetAmount: grossAmount - fees - taxes,
      }, 201);
    } catch (error) {
      console.error('Create distributions error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to create distributions', 500);
    }
  }
);

/**
 * GET /co-invest/dashboard
 * Get investor dashboard summary
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all user investments
    const investments = await prisma.coInvestmentInvestor.findMany({
      where: {
        userId,
        paymentStatus: 'completed',
      },
      include: {
        pool: {
          select: {
            name: true,
            slug: true,
            status: true,
            expectedReturn: true,
          },
        },
        distributions: {
          where: { status: 'completed' },
        },
      },
    });

    // Calculate totals
    const totalInvested = investments.reduce(
      (sum, inv) => sum + inv.amountInvested.toNumber(),
      0
    );

    const totalDistributions = investments.reduce(
      (sum, inv) =>
        sum +
        inv.distributions.reduce((d, dist) => d + dist.netAmount.toNumber(), 0),
      0
    );

    const activeInvestments = investments.filter(
      (inv) => ['seeking', 'active', 'distributing'].includes(inv.pool.status)
    ).length;

    // Get recent distributions
    const recentDistributions = await prisma.coInvestmentDistribution.findMany({
      where: {
        investor: { userId },
        status: 'completed',
      },
      include: {
        pool: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    sendSuccess(res, {
      summary: {
        totalInvested,
        totalDistributions,
        totalReturn: totalDistributions,
        returnPercentage: totalInvested > 0
          ? ((totalDistributions / totalInvested) * 100).toFixed(2)
          : '0.00',
        activeInvestments,
        totalInvestments: investments.length,
      },
      investments: investments.map((inv) => ({
        id: inv.id,
        pool: inv.pool,
        shares: inv.shares,
        amountInvested: inv.amountInvested.toNumber(),
        ownershipPercent: inv.ownershipPercent?.toNumber() || 0,
        distributionsReceived: inv.distributions.reduce(
          (sum, d) => sum + d.netAmount.toNumber(),
          0
        ),
      })),
      recentDistributions: recentDistributions.map((dist) => ({
        id: dist.id,
        poolName: dist.pool.name,
        type: dist.type,
        netAmount: dist.netAmount.toNumber(),
        paidAt: dist.paidAt,
      })),
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to fetch dashboard', 500);
  }
});

// ==================== INVESTMENT CANCELLATION ====================

/**
 * POST /co-invest/investments/:investorId/cancel
 * Cancel a pending investment (investor only)
 */
router.post(
  '/investments/:investorId/cancel',
  authenticate,
  validate(cancelInvestmentSchema),
  async (req: Request, res: Response) => {
    try {
      const investorId = req.params.investorId as string;
      const userId = req.user!.id;
      const { reason } = req.body;

      // Find the investment
      const investor = await prisma.coInvestmentInvestor.findUnique({
        where: { id: investorId },
        include: {
          pool: true,
        },
      });

      if (!investor) {
        return sendError(res, 'NOT_FOUND', 'Investment not found', 404);
      }

      // Verify ownership
      if (investor.userId !== userId) {
        return sendError(res, 'FORBIDDEN', 'Not authorized to cancel this investment', 403);
      }

      // Only pending investments can be cancelled directly
      if (investor.paymentStatus === 'completed') {
        // For completed investments in pools that are still seeking, request withdrawal
        if (!['seeking', 'active'].includes(investor.pool.status)) {
          return sendError(
            res,
            'INVALID_OPERATION',
            'Cannot withdraw from a pool that is no longer active. Contact support for assistance.',
            400
          );
        }

        // Process refund via Stripe
        if (investor.stripePaymentId) {
          try {
            await createRefund({
              paymentIntentId: investor.stripePaymentId,
              reason: 'requested_by_customer',
              metadata: {
                investorId: investor.id,
                poolId: investor.poolId,
                userId,
                reason: reason || 'Investor requested withdrawal',
              },
            });
          } catch (stripeError) {
            console.error('Stripe refund error:', stripeError);
            return sendError(res, 'PAYMENT_ERROR', 'Failed to process refund', 500);
          }
        }

        // Update pool amounts
        const amountToReturn = investor.amountInvested.toNumber();
        const sharesToReturn = investor.shares;

        await prisma.$transaction([
          // Update investor status
          prisma.coInvestmentInvestor.update({
            where: { id: investorId },
            data: {
              paymentStatus: 'refunded',
            },
          }),

          // Update pool
          prisma.coInvestmentPool.update({
            where: { id: investor.poolId },
            data: {
              raisedAmount: { decrement: amountToReturn },
              availableShares: { increment: sharesToReturn },
            },
          }),
        ]);

        sendSuccess(res, {
          status: 'refunded',
          message: 'Your investment has been refunded. Funds will be returned within 5-10 business days.',
          amountRefunded: amountToReturn,
        });
      } else if (investor.paymentStatus === 'pending') {
        // Cancel pending payment intent
        if (investor.stripePaymentId) {
          await cancelPaymentIntent(investor.stripePaymentId);
        }

        // Delete the pending investment
        await prisma.coInvestmentInvestor.delete({
          where: { id: investorId },
        });

        sendSuccess(res, {
          status: 'cancelled',
          message: 'Your pending investment has been cancelled.',
        });
      } else {
        return sendError(
          res,
          'INVALID_OPERATION',
          `Cannot cancel investment with status: ${investor.paymentStatus}`,
          400
        );
      }
    } catch (error) {
      console.error('Cancel investment error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to cancel investment', 500);
    }
  }
);

// ==================== POOL CANCELLATION ====================

/**
 * POST /co-invest/pools/:id/cancel
 * Cancel an entire pool and refund all investors (manager/admin only)
 */
router.post(
  '/pools/:id/cancel',
  authenticate,
  requireRoles(['admin', 'landlord']),
  validate(cancelPoolSchema),
  async (req: Request, res: Response) => {
    try {
      const poolId = req.params.id as string;
      const userId = req.user!.id;
      const { reason, notifyInvestors } = req.body;

      // Get pool with investors
      const pool = await prisma.coInvestmentPool.findUnique({
        where: { id: poolId },
        include: {
          investors: {
            where: {
              paymentStatus: { in: ['pending', 'completed'] },
            },
          },
        },
      });

      if (!pool) {
        return sendError(res, 'NOT_FOUND', 'Pool not found', 404);
      }

      // Verify manager permission
      if (pool.managerId !== userId && req.user!.role !== 'admin') {
        return sendError(res, 'FORBIDDEN', 'Not authorized to cancel this pool', 403);
      }

      // Cannot cancel completed/closed pools
      if (['completed', 'cancelled'].includes(pool.status)) {
        return sendError(
          res,
          'INVALID_OPERATION',
          'Cannot cancel a pool that is already completed or cancelled',
          400
        );
      }

      // Process refunds for all investors
      const refundResults: { investorId: string; status: string; error?: string }[] = [];

      for (const investor of pool.investors) {
        try {
          if (investor.paymentStatus === 'completed' && investor.stripePaymentId) {
            await createRefund({
              paymentIntentId: investor.stripePaymentId,
              reason: 'requested_by_customer',
              metadata: {
                poolId,
                investorId: investor.id,
                reason: `Pool cancelled: ${reason}`,
              },
            });
            refundResults.push({ investorId: investor.id, status: 'refunded' });
          } else if (investor.paymentStatus === 'pending' && investor.stripePaymentId) {
            await cancelPaymentIntent(investor.stripePaymentId);
            refundResults.push({ investorId: investor.id, status: 'cancelled' });
          }
        } catch (refundError) {
          console.error(`Refund error for investor ${investor.id}:`, refundError);
          refundResults.push({
            investorId: investor.id,
            status: 'failed',
            error: 'Refund processing failed',
          });
        }
      }

      // Update all investor records and pool
      await prisma.$transaction([
        // Mark all investments as refunded/cancelled
        prisma.coInvestmentInvestor.updateMany({
          where: {
            poolId,
            paymentStatus: 'completed',
          },
          data: {
            paymentStatus: 'refunded',
          },
        }),

        // Delete pending investments
        prisma.coInvestmentInvestor.deleteMany({
          where: {
            poolId,
            paymentStatus: 'pending',
          },
        }),

        // Update pool status
        prisma.coInvestmentPool.update({
          where: { id: poolId },
          data: {
            status: 'cancelled',
            raisedAmount: 0,
            availableShares: pool.totalShares,
          },
        }),
      ]);

      // TODO: If notifyInvestors is true, send notification emails

      sendSuccess(res, {
        status: 'cancelled',
        message: 'Pool has been cancelled. All investors will be refunded.',
        investorsProcessed: pool.investors.length,
        refundResults,
      });
    } catch (error) {
      console.error('Cancel pool error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to cancel pool', 500);
    }
  }
);

// ==================== DISTRIBUTION PAYOUT ====================

/**
 * POST /co-invest/distributions/:distributionId/payout
 * Mark a distribution as paid (manager/admin only)
 * Note: Actual fund transfer handled externally (bank transfer, check, etc.)
 */
router.post(
  '/distributions/:distributionId/payout',
  authenticate,
  requireRoles(['admin', 'landlord']),
  validate(processDistributionPayoutSchema),
  async (req: Request, res: Response) => {
    try {
      const distributionId = req.params.distributionId as string;
      const userId = req.user!.id;
      const { paymentMethod, notes } = req.body as { paymentMethod?: string; notes?: string };

      // Get distribution with related data
      const distribution = await prisma.coInvestmentDistribution.findUnique({
        where: { id: distributionId },
        include: {
          pool: true,
          investor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!distribution) {
        return sendError(res, 'NOT_FOUND', 'Distribution not found', 404);
      }

      // Verify permission
      if (distribution.pool.managerId !== userId && req.user!.role !== 'admin') {
        return sendError(res, 'FORBIDDEN', 'Not authorized to process this payout', 403);
      }

      // Check distribution status
      if (distribution.status !== 'pending') {
        return sendError(
          res,
          'INVALID_OPERATION',
          `Cannot process distribution with status: ${distribution.status}`,
          400
        );
      }

      // Update distribution record
      await prisma.coInvestmentDistribution.update({
        where: { id: distributionId },
        data: {
          status: 'completed',
          paymentMethod: paymentMethod || 'manual',
          notes: notes || distribution.notes,
          paidAt: new Date(),
        },
      });

      // Update investor's total distributed
      if (distribution.investorId) {
        await prisma.coInvestmentInvestor.update({
          where: { id: distribution.investorId },
          data: {
            totalDistributed: {
              increment: distribution.netAmount.toNumber(),
            },
          },
        });
      }

      sendSuccess(res, {
        status: 'completed',
        message: 'Distribution marked as paid',
        amount: distribution.netAmount.toNumber(),
        recipient: distribution.investor ? {
          name: `${distribution.investor.user.firstName} ${distribution.investor.user.lastName}`,
          email: distribution.investor.user.email,
        } : null,
      });
    } catch (error) {
      console.error('Process payout error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to process payout', 500);
    }
  }
);

/**
 * POST /co-invest/pools/:poolId/distributions/payout-all
 * Mark all pending distributions as paid (manager/admin only)
 */
router.post(
  '/pools/:poolId/distributions/payout-all',
  authenticate,
  requireRoles(['admin', 'landlord']),
  async (req: Request, res: Response) => {
    try {
      const poolId = req.params.poolId as string;
      const userId = req.user!.id;
      const { paymentMethod } = req.body as { paymentMethod?: string };

      // Verify pool access
      const pool = await prisma.coInvestmentPool.findUnique({
        where: { id: poolId },
      });

      if (!pool) {
        return sendError(res, 'NOT_FOUND', 'Pool not found', 404);
      }

      if (pool.managerId !== userId && req.user!.role !== 'admin') {
        return sendError(res, 'FORBIDDEN', 'Not authorized to process payouts', 403);
      }

      // Get all pending distributions
      const pendingDistributions = await prisma.coInvestmentDistribution.findMany({
        where: {
          poolId,
          status: 'pending',
        },
      });

      if (pendingDistributions.length === 0) {
        return sendSuccess(res, {
          message: 'No pending distributions to process',
          processed: 0,
        });
      }

      // Update all distributions to completed
      const now = new Date();
      await prisma.coInvestmentDistribution.updateMany({
        where: {
          poolId,
          status: 'pending',
        },
        data: {
          status: 'completed',
          paymentMethod: paymentMethod || 'manual',
          paidAt: now,
        },
      });

      // Update investor totals
      for (const dist of pendingDistributions) {
        if (dist.investorId) {
          await prisma.coInvestmentInvestor.update({
            where: { id: dist.investorId },
            data: {
              totalDistributed: {
                increment: dist.netAmount.toNumber(),
              },
            },
          });
        }
      }

      const totalPaid = pendingDistributions.reduce(
        (sum, d) => sum + d.netAmount.toNumber(),
        0
      );

      sendSuccess(res, {
        message: 'All pending distributions marked as paid',
        processed: pendingDistributions.length,
        totalAmount: totalPaid,
      });
    } catch (error) {
      console.error('Batch payout error:', error);
      sendError(res, 'SERVER_ERROR', 'Failed to process batch payouts', 500);
    }
  }
);

export default router;
