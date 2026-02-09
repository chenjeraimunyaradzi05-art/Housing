/**
 * Account Routes
 * Handles bank account linking, management, and sync
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import plaid, { mapAccountType } from '../lib/plaid';
import {
  linkAccountSchema,
  createManualAccountSchema,
  updateAccountSchema,
  listAccountsSchema,
  syncAccountsSchema,
} from '../schemas/financial.schema';
import { success, created, notFound, badRequest } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/accounts/link-token
 * Create a Plaid Link token for initializing Plaid Link
 */
router.get('/link-token', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const linkToken = await plaid.createLinkToken(userId);

  success(res, { linkToken: linkToken.link_token, expiration: linkToken.expiration });
});

/**
 * POST /api/accounts/link
 * Exchange public token and link accounts after Plaid Link success
 */
router.post('/link', validate(linkAccountSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { publicToken, institutionId, institutionName } = req.body;

  // Exchange public token for access token
  const { accessToken, itemId } = await plaid.exchangePublicToken(publicToken);

  // Get accounts from Plaid
  const accountsResponse = await plaid.getAccounts(accessToken);
  const plaidAccounts = accountsResponse.accounts;

  // Get institution details
  let institution = null;
  if (institutionId) {
    try {
      institution = await plaid.getInstitution(institutionId);
    } catch {
      // Institution lookup is optional
    }
  }

  // Create accounts in database
  const createdAccounts = await Promise.all(
    plaidAccounts.map(async (account) => {
      return prisma.userAccount.create({
        data: {
          userId,
          plaidItemId: itemId,
          plaidAccessToken: accessToken,
          institutionId: institutionId || institution?.institution_id || null,
          institutionName: institutionName || institution?.name || null,
          institutionLogo: institution?.logo || null,
          accountId: account.account_id,
          name: account.name,
          officialName: account.official_name || null,
          type: mapAccountType(account.type, account.subtype || undefined),
          subtype: account.subtype || null,
          mask: account.mask || null,
          currentBalance: account.balances.current ?? undefined,
          availableBalance: account.balances.available ?? undefined,
          limit: account.balances.limit ?? undefined,
          lastSynced: new Date(),
        },
      });
    })
  );

  created(res, {
    accounts: createdAccounts,
    message: `Successfully linked ${createdAccounts.length} account(s)`,
  });
});

/**
 * POST /api/accounts/manual
 * Create a manual (non-linked) account
 */
router.post('/manual', validate(createManualAccountSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, type, subtype, currentBalance, currency, institutionName } = req.body;

  // Generate a unique accountId for manual accounts
  const manualAccountId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const account = await prisma.userAccount.create({
    data: {
      userId,
      accountId: manualAccountId,
      name,
      type,
      subtype: subtype || null,
      currentBalance: currentBalance || 0,
      currency: currency || 'USD',
      institutionName: institutionName || null,
      isManual: true,
    },
  });

  created(res, account);
});

/**
 * GET /api/accounts
 * List all user accounts
 */
router.get('/', validate(listAccountsSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { type, status, includeInactive } = req.query as {
    type?: string;
    status?: string;
    includeInactive?: boolean;
  };

  const typeFilter = typeof type === 'string' ? type : undefined;
  const statusFilter = typeof status === 'string' ? status : undefined;

  const accounts = await prisma.userAccount.findMany({
    where: {
      userId,
      ...(typeFilter && { type: typeFilter }),
      ...(statusFilter && { status: statusFilter }),
      ...(!includeInactive && !statusFilter && { status: 'active' }),
    },
    orderBy: [{ institutionName: 'asc' }, { name: 'asc' }],
  });

  // Calculate totals
  const totals = accounts.reduce(
    (acc, account) => {
      const balance = account.currentBalance?.toNumber() || 0;
      if (account.includeInNetWorth) {
        if (account.type === 'credit' || account.type === 'loan') {
          acc.totalDebt += Math.abs(balance);
        } else {
          acc.totalAssets += balance;
        }
      }
      return acc;
    },
    { totalAssets: 0, totalDebt: 0 }
  );

  success(res, {
    accounts,
    summary: {
      totalAccounts: accounts.length,
      totalAssets: totals.totalAssets,
      totalDebt: totals.totalDebt,
      netWorth: totals.totalAssets - totals.totalDebt,
    },
  });
});

/**
 * GET /api/accounts/:id
 * Get a single account
 */
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const account = await prisma.userAccount.findFirst({
    where: { id, userId },
    include: {
      transactions: {
        take: 10,
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!account) {
    return notFound(res, 'Account not found');
  }

  success(res, account);
});

/**
 * PATCH /api/accounts/:id
 * Update account settings
 */
router.patch('/:id', validate(updateAccountSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { name, includeInNetWorth, currentBalance } = req.body;

  const account = await prisma.userAccount.findFirst({
    where: { id, userId },
  });

  if (!account) {
    return notFound(res, 'Account not found');
  }

  // Only allow balance update for manual accounts
  if (currentBalance !== undefined && !account.isManual) {
    return badRequest(res, 'Cannot manually update balance for linked accounts');
  }

  const updated = await prisma.userAccount.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(includeInNetWorth !== undefined && { includeInNetWorth }),
      ...(currentBalance !== undefined && { currentBalance }),
    },
  });

  success(res, updated);
});

/**
 * DELETE /api/accounts/:id
 * Unlink/remove an account
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const account = await prisma.userAccount.findFirst({
    where: { id, userId },
  });

  if (!account) {
    return notFound(res, 'Account not found');
  }

  // If linked account, remove from Plaid
  if (account.plaidAccessToken && account.plaidItemId) {
    try {
      // Check if other accounts share the same item
      const sameItemAccounts = await prisma.userAccount.count({
        where: { plaidItemId: account.plaidItemId, userId },
      });

      // Only remove from Plaid if this is the last account for this item
      if (sameItemAccounts === 1) {
        await plaid.removeItem(account.plaidAccessToken);
      }
    } catch (error) {
      console.error('Failed to remove Plaid item:', error);
      // Continue with deletion even if Plaid removal fails
    }
  }

  await prisma.userAccount.delete({ where: { id } });

  success(res, { message: 'Account removed successfully' });
});

/**
 * POST /api/accounts/sync
 * Sync account balances and transactions
 */
router.post('/sync', validate(syncAccountsSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { accountIds } = req.body;

  // Get accounts to sync
  const accounts = await prisma.userAccount.findMany({
    where: {
      userId,
      ...(accountIds?.length && { id: { in: accountIds } }),
      plaidAccessToken: { not: null },
      status: 'active',
    },
  });

  const results = {
    synced: 0,
    errors: 0,
    transactions: 0,
  };

  // Group accounts by itemId to minimize API calls
  const itemGroups = accounts.reduce((acc, account) => {
    if (account.plaidItemId && account.plaidAccessToken) {
      if (!acc[account.plaidItemId]) {
        acc[account.plaidItemId] = {
          accessToken: account.plaidAccessToken,
          accounts: [],
        };
      }
      acc[account.plaidItemId].accounts.push(account);
    }
    return acc;
  }, {} as Record<string, { accessToken: string; accounts: typeof accounts }>);

  for (const [, { accessToken, accounts: itemAccounts }] of Object.entries(itemGroups)) {
    try {
      // Get latest balances
      const balances = await plaid.getBalances(accessToken);

      // Update balances
      for (const account of itemAccounts) {
        const plaidAccount = balances.accounts.find(a => a.account_id === account.accountId);
        if (plaidAccount) {
          await prisma.userAccount.update({
            where: { id: account.id },
            data: {
              currentBalance: plaidAccount.balances.current,
              availableBalance: plaidAccount.balances.available,
              limit: plaidAccount.balances.limit,
              lastSynced: new Date(),
              status: 'active',
              errorCode: null,
              errorMessage: null,
            },
          });
          results.synced++;
        }
      }

      // Sync transactions (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const txResponse = await plaid.getTransactions(accessToken, startDate, endDate);

      for (const tx of txResponse.transactions) {
        const account = itemAccounts.find(a => a.accountId === tx.account_id);
        if (!account) continue;

        // Upsert transaction
        await prisma.transaction.upsert({
          where: { plaidTransactionId: tx.transaction_id },
          create: {
            userId,
            accountId: account.id,
            plaidTransactionId: tx.transaction_id,
            name: tx.name,
            merchantName: tx.merchant_name || undefined,
            amount: tx.amount, // Plaid: positive = expense
            date: new Date(tx.date),
            authorizedDate: tx.authorized_date ? new Date(tx.authorized_date) : undefined,
            pending: tx.pending,
            category: tx.personal_finance_category?.primary || tx.category?.[0],
            subcategory: tx.personal_finance_category?.detailed || tx.category?.[1],
            paymentChannel: tx.payment_channel,
            location: tx.location ? {
              address: tx.location.address,
              city: tx.location.city,
              state: tx.location.region,
              lat: tx.location.lat,
              lon: tx.location.lon,
            } : undefined,
          },
          update: {
            name: tx.name,
            merchantName: tx.merchant_name || undefined,
            amount: tx.amount,
            pending: tx.pending,
            category: tx.personal_finance_category?.primary || tx.category?.[0],
            subcategory: tx.personal_finance_category?.detailed || tx.category?.[1],
          },
        });
        results.transactions++;
      }
    } catch (error) {
      console.error('Sync error:', error);
      results.errors++;

      // Update account status
      for (const account of itemAccounts) {
        await prisma.userAccount.update({
          where: { id: account.id },
          data: {
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Sync failed',
          },
        });
      }
    }
  }

  success(res, {
    message: 'Sync completed',
    ...results,
  });
});

/**
 * GET /api/accounts/:id/refresh
 * Refresh a single account's connection (generate update link token)
 */
router.get('/:id/refresh', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const account = await prisma.userAccount.findFirst({
    where: { id, userId, plaidAccessToken: { not: null } },
  });

  if (!account || !account.plaidAccessToken) {
    return notFound(res, 'Linked account not found');
  }

  const linkToken = await plaid.createLinkToken(userId, account.plaidAccessToken);

  success(res, { linkToken: linkToken.link_token });
});

export default router;
