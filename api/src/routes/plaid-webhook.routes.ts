/**
 * Plaid Webhook Routes
 * Handles Plaid webhook events for transaction updates, errors, etc.
 */
import { Router, Request, Response } from 'express';
import express from 'express';
import { prisma } from '../lib/prisma';
import plaid from '../lib/plaid';
import { success } from '../utils/response';

const router = Router();

// Use raw body for webhook verification
router.use(express.raw({ type: 'application/json' }));

/**
 * POST /webhooks/plaid
 * Handle Plaid webhook events
 */
router.post('/', async (req: Request, res: Response) => {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const {
    webhook_type,
    webhook_code,
    item_id,
    error,
    new_transactions,
    removed_transactions,
  } = body;

  console.log(`Plaid webhook: ${webhook_type}/${webhook_code} for item ${item_id}`);

  try {
    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhook_code, item_id, new_transactions, removed_transactions);
        break;

      case 'ITEM':
        await handleItemWebhook(webhook_code, item_id, error);
        break;

      case 'AUTH':
        // Handle auth updates if needed
        console.log(`Auth webhook: ${webhook_code}`);
        break;

      case 'ASSETS':
        // Handle asset reports if needed
        console.log(`Assets webhook: ${webhook_code}`);
        break;

      default:
        console.log(`Unhandled webhook type: ${webhook_type}`);
    }

    success(res, { received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Always return 200 to acknowledge receipt
    success(res, { received: true, error: 'Processing error' });
  }
});

/**
 * Handle transaction-related webhooks
 */
async function handleTransactionsWebhook(
  code: string,
  itemId: string,
  newTxCount?: number,
  removedTxIds?: string[]
) {
  // Find accounts with this item
  const accounts = await prisma.userAccount.findMany({
    where: { plaidItemId: itemId },
  });

  if (!accounts.length) {
    console.log(`No accounts found for item ${itemId}`);
    return;
  }

  const accessToken = accounts[0].plaidAccessToken;
  if (!accessToken) {
    console.log(`No access token for item ${itemId}`);
    return;
  }

  switch (code) {
    case 'INITIAL_UPDATE':
      // Initial transaction pull complete
      console.log(`Initial update complete for ${itemId}, ${newTxCount} transactions`);
      await syncTransactionsForItem(accounts, accessToken);
      break;

    case 'HISTORICAL_UPDATE':
      // Historical transactions ready
      console.log(`Historical update complete for ${itemId}`);
      await syncTransactionsForItem(accounts, accessToken, 90); // Get 90 days
      break;

    case 'DEFAULT_UPDATE':
      // Regular daily update
      console.log(`Default update for ${itemId}, ${newTxCount} new transactions`);
      await syncTransactionsForItem(accounts, accessToken, 14); // Get last 14 days
      break;

    case 'TRANSACTIONS_REMOVED':
      // Handle removed transactions
      if (removedTxIds?.length) {
        console.log(`Removing ${removedTxIds.length} transactions`);
        await prisma.transaction.deleteMany({
          where: {
            plaidTransactionId: { in: removedTxIds },
          },
        });
      }
      break;

    case 'SYNC_UPDATES_AVAILABLE':
      // New incremental sync updates available
      console.log(`Sync updates available for ${itemId}`);
      await syncTransactionsForItem(accounts, accessToken);
      break;

    default:
      console.log(`Unhandled transaction webhook code: ${code}`);
  }
}

/**
 * Handle item-related webhooks
 */
async function handleItemWebhook(code: string, itemId: string, error?: { error_code: string; error_message: string }) {
  switch (code) {
    case 'ERROR':
      // Item error - requires user action
      console.log(`Item error for ${itemId}:`, error);
      await prisma.userAccount.updateMany({
        where: { plaidItemId: itemId },
        data: {
          status: 'error',
          errorCode: error?.error_code,
          errorMessage: error?.error_message,
        },
      });
      break;

    case 'PENDING_EXPIRATION':
      // Access token expiring soon
      console.log(`Access expiring for ${itemId}`);
      await prisma.userAccount.updateMany({
        where: { plaidItemId: itemId },
        data: {
          status: 'error',
          errorCode: 'PENDING_EXPIRATION',
          errorMessage: 'Access is expiring, please reconnect your account',
        },
      });
      break;

    case 'USER_PERMISSION_REVOKED':
      // User revoked access
      console.log(`User revoked access for ${itemId}`);
      await prisma.userAccount.updateMany({
        where: { plaidItemId: itemId },
        data: {
          status: 'disconnected',
          errorCode: 'USER_PERMISSION_REVOKED',
          errorMessage: 'Access was revoked',
        },
      });
      break;

    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      // Webhook URL updated successfully
      console.log(`Webhook update acknowledged for ${itemId}`);
      break;

    default:
      console.log(`Unhandled item webhook code: ${code}`);
  }
}

/**
 * Sync transactions for accounts with a given item
 */
async function syncTransactionsForItem(
  accounts: Array<{ id: string; userId: string; accountId: string | null }>,
  accessToken: string,
  days: number = 30
) {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const txResponse = await plaid.getTransactions(accessToken, startDate, endDate);

    for (const tx of txResponse.transactions) {
      const account = accounts.find(a => a.accountId === tx.account_id);
      if (!account) continue;

      await prisma.transaction.upsert({
        where: { plaidTransactionId: tx.transaction_id },
        create: {
          userId: account.userId,
          accountId: account.id,
          plaidTransactionId: tx.transaction_id,
          name: tx.name,
          merchantName: tx.merchant_name || undefined,
          amount: tx.amount,
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
    }

    // Update last synced time
    await prisma.userAccount.updateMany({
      where: { id: { in: accounts.map(a => a.id) } },
      data: { lastSynced: new Date() },
    });

    console.log(`Synced ${txResponse.transactions.length} transactions for ${accounts.length} accounts`);
  } catch (error) {
    console.error('Error syncing transactions:', error);
  }
}

export default router;
