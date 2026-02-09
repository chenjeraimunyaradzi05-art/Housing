/**
 * Financial Goal Routes
 * Handles savings goals, debt payoff tracking, and contributions
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import {
  createGoalSchema,
  updateGoalSchema,
  listGoalsSchema,
  addContributionSchema,
} from '../schemas/financial.schema';
import { success, created, notFound, badRequest } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/goals
 * List all financial goals
 */
router.get('/', validate(listGoalsSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, type, priority } = req.query as {
    status?: string;
    type?: string;
    priority?: string;
  };

  const goals = await prisma.financialGoal.findMany({
    where: {
      userId,
      ...(status && { status }),
      ...(type && { type }),
      ...(priority && { priority }),
    },
    include: {
      contributions: {
        orderBy: { contributionDate: 'desc' },
        take: 5,
      },
      _count: {
        select: { contributions: true },
      },
    },
    orderBy: [{ priority: 'desc' }, { targetDate: 'asc' }],
  });

  // Calculate progress for each goal
  const goalsWithProgress = goals.map((goal) => {
    const currentAmount = goal.currentAmount.toNumber();
    const targetAmount = goal.targetAmount.toNumber();
    const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    // Calculate projected completion date based on contribution rate
    let projectedCompletion: Date | null = null;
    if (goal.contributions.length >= 2 && progress < 100) {
      const recentContributions = goal.contributions.slice(0, 5);
      const totalContributed = recentContributions.reduce(
        (sum, c) => sum + c.amount.toNumber(),
        0
      );
      const avgContribution = totalContributed / recentContributions.length;
      const remaining = targetAmount - currentAmount;
      const monthsToComplete = avgContribution > 0 ? remaining / avgContribution : Infinity;

      if (isFinite(monthsToComplete)) {
        projectedCompletion = new Date();
        projectedCompletion.setMonth(projectedCompletion.getMonth() + Math.ceil(monthsToComplete));
      }
    }

    return {
      ...goal,
      currentAmount,
      targetAmount,
      progress: Math.min(Math.round(progress * 100) / 100, 100),
      remaining: Math.max(targetAmount - currentAmount, 0),
      isComplete: progress >= 100,
      contributionCount: goal._count.contributions,
      projectedCompletion,
      recentContributions: goal.contributions.map((c) => ({
        ...c,
        amount: c.amount.toNumber(),
      })),
    };
  });

  success(res, { goals: goalsWithProgress });
});

/**
 * GET /api/goals/summary
 * Get overall goals summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const goals = await prisma.financialGoal.findMany({
    where: { userId, status: 'active' },
  });

  const summary = goals.reduce(
    (acc, goal) => {
      const current = goal.currentAmount.toNumber();
      const target = goal.targetAmount.toNumber();

      acc.totalTargetAmount += target;
      acc.totalCurrentAmount += current;

      if (current >= target) {
        acc.completedGoals++;
      }

      return acc;
    },
    {
      totalGoals: goals.length,
      completedGoals: 0,
      totalTargetAmount: 0,
      totalCurrentAmount: 0,
    }
  );

  success(res, {
    ...summary,
    overallProgress:
      summary.totalTargetAmount > 0
        ? Math.round((summary.totalCurrentAmount / summary.totalTargetAmount) * 100)
        : 0,
    remaining: summary.totalTargetAmount - summary.totalCurrentAmount,
  });
});

/**
 * GET /api/goals/:id
 * Get a single goal with full contribution history
 */
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const goal = await prisma.financialGoal.findFirst({
    where: { id, userId },
    include: {
      contributions: {
        orderBy: { contributionDate: 'desc' },
      },
    },
  });

  if (!goal) {
    return notFound(res, 'Goal not found');
  }

  const currentAmount = goal.currentAmount.toNumber();
  const targetAmount = goal.targetAmount.toNumber();

  success(res, {
    ...goal,
    currentAmount,
    targetAmount,
    progress: targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0,
    remaining: Math.max(targetAmount - currentAmount, 0),
    contributions: goal.contributions.map((c) => ({
      ...c,
      amount: c.amount.toNumber(),
    })),
  });
});

/**
 * POST /api/goals
 * Create a new financial goal
 */
router.post('/', validate(createGoalSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    description,
    targetAmount,
    currentAmount,
    targetDate,
    type,
    priority,
    linkedAccountId,
    color,
    icon,
  } = req.body;

  // Validate linked account if provided
  if (linkedAccountId) {
    const account = await prisma.userAccount.findFirst({
      where: { id: linkedAccountId, userId },
    });
    if (!account) {
      return badRequest(res, 'Linked account not found');
    }
  }

  const goal = await prisma.financialGoal.create({
    data: {
      userId,
      name,
      description,
      targetAmount,
      currentAmount: currentAmount || 0,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      type,
      priority,
      linkedAccountId,
      color,
      icon,
    },
  });

  created(res, goal);
});

/**
 * PATCH /api/goals/:id
 * Update a goal
 */
router.patch('/:id', validate(updateGoalSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const updates = req.body;

  const goal = await prisma.financialGoal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    return notFound(res, 'Goal not found');
  }

  // Validate linked account if being updated
  if (updates.linkedAccountId) {
    const account = await prisma.userAccount.findFirst({
      where: { id: updates.linkedAccountId, userId },
    });
    if (!account) {
      return badRequest(res, 'Linked account not found');
    }
  }

  // Handle date conversion
  if (updates.targetDate) {
    updates.targetDate = new Date(updates.targetDate);
  }

  const updated = await prisma.financialGoal.update({
    where: { id },
    data: updates,
  });

  // Auto-complete if current amount reaches target
  if (updated.currentAmount.toNumber() >= updated.targetAmount.toNumber() && updated.status === 'active') {
    await prisma.financialGoal.update({
      where: { id },
      data: { status: 'completed' },
    });
    updated.status = 'completed';
  }

  success(res, updated);
});

/**
 * POST /api/goals/:id/contributions
 * Add a contribution to a goal
 */
router.post(
  '/:id/contributions',
  validate(addContributionSchema),
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { amount, note, contributionDate, transactionId } = req.body;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      return notFound(res, 'Goal not found');
    }

    if (goal.status !== 'active') {
      return badRequest(res, 'Cannot add contributions to an inactive goal');
    }

    // Create contribution and update goal in transaction
    const [contribution, updatedGoal] = await prisma.$transaction([
      prisma.goalContribution.create({
        data: {
          goalId: id,
          amount,
          note,
          contributionDate: contributionDate ? new Date(contributionDate) : new Date(),
          transactionId,
        },
      }),
      prisma.financialGoal.update({
        where: { id },
        data: {
          currentAmount: { increment: amount },
        },
      }),
    ]);

    // Check if goal is now complete
    const newAmount = updatedGoal.currentAmount.toNumber();
    const targetAmount = updatedGoal.targetAmount.toNumber();
    let status = updatedGoal.status;

    if (newAmount >= targetAmount) {
      await prisma.financialGoal.update({
        where: { id },
        data: { status: 'completed' },
      });
      status = 'completed';
    }

    created(res, {
      contribution: {
        ...contribution,
        amount: contribution.amount.toNumber(),
      },
      goal: {
        currentAmount: newAmount,
        targetAmount,
        progress: Math.round((newAmount / targetAmount) * 100),
        status,
        isComplete: newAmount >= targetAmount,
      },
    });
  }
);

/**
 * DELETE /api/goals/:id/contributions/:contributionId
 * Remove a contribution from a goal
 */
router.delete('/:id/contributions/:contributionId', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id, contributionId } = req.params as { id: string; contributionId: string };

  const goal = await prisma.financialGoal.findFirst({
    where: { id, userId },
    include: {
      contributions: {
        where: { id: contributionId },
      },
    },
  });

  if (!goal) {
    return notFound(res, 'Goal not found');
  }

  if (goal.contributions.length === 0) {
    return notFound(res, 'Contribution not found');
  }

  const contribution = goal.contributions[0];

  // Remove contribution and update goal
  await prisma.$transaction([
    prisma.goalContribution.delete({
      where: { id: contributionId },
    }),
    prisma.financialGoal.update({
      where: { id },
      data: {
        currentAmount: { decrement: contribution.amount },
        status: 'active', // Reactivate if was completed
      },
    }),
  ]);

  success(res, { message: 'Contribution removed' });
});

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const goal = await prisma.financialGoal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    return notFound(res, 'Goal not found');
  }

  await prisma.financialGoal.delete({
    where: { id },
  });

  success(res, { message: 'Goal deleted' });
});

export default router;
