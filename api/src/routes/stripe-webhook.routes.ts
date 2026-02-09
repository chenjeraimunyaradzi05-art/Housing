import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { constructWebhookEvent } from '../lib/stripe';
import Stripe from 'stripe';

const router = Router();

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 *
 * NOTE: This endpoint must receive raw body, not JSON parsed.
 * Configure express.raw() middleware for this route.
 */
router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || typeof sig !== 'string') {
    console.error('Webhook error: No signature');
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    // Still return 200 to acknowledge receipt
    // Stripe will retry on 4xx/5xx errors
  }

  res.json({ received: true });
});

/**
 * Handle successful payment for investments
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { poolId, userId, shares, type } = paymentIntent.metadata;

  // Only handle co-investment payments
  if (type !== 'co_investment' || !poolId || !userId) {
    return;
  }

  console.log(`Processing successful payment for pool ${poolId}, user ${userId}`);

  // Update investor record
  const investor = await prisma.coInvestmentInvestor.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });

  if (!investor) {
    console.error(`Investor not found for pool ${poolId}, user ${userId}`);
    return;
  }

  // Get pool for calculations
  const pool = await prisma.coInvestmentPool.findUnique({
    where: { id: poolId },
  });

  if (!pool) {
    console.error(`Pool not found: ${poolId}`);
    return;
  }

  const sharesInt = parseInt(shares, 10);
  const amountInvested = investor.amountInvested.toNumber();

  // Calculate new pool totals
  const newRaisedAmount = pool.raisedAmount.toNumber() + amountInvested;
  const newAvailableShares = pool.availableShares - sharesInt;

  // Calculate ownership percentage
  const totalInvested = newRaisedAmount;
  const ownershipPercent = (amountInvested / totalInvested) * 100;

  // Update in transaction
  await prisma.$transaction([
    // Update investor
    prisma.coInvestmentInvestor.update({
      where: { id: investor.id },
      data: {
        paymentStatus: 'completed',
        ownershipPercent,
      },
    }),

    // Update pool
    prisma.coInvestmentPool.update({
      where: { id: poolId },
      data: {
        raisedAmount: newRaisedAmount,
        availableShares: newAvailableShares,
        // Auto-update status if fully funded
        ...(newAvailableShares === 0 && {
          status: 'funded',
        }),
      },
    }),

    // Recalculate all investor ownership percentages
    ...await recalculateOwnershipPercentages(poolId, newRaisedAmount),
  ]);

  console.log(`Successfully processed investment: ${sharesInt} shares, $${amountInvested}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { poolId, userId, type } = paymentIntent.metadata;

  if (type !== 'co_investment' || !poolId || !userId) {
    return;
  }

  console.log(`Processing failed payment for pool ${poolId}, user ${userId}`);

  await prisma.coInvestmentInvestor.updateMany({
    where: {
      poolId,
      userId,
      stripePaymentId: paymentIntent.id,
    },
    data: {
      paymentStatus: 'failed',
    },
  });
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { poolId, userId, type } = paymentIntent.metadata;

  if (type !== 'co_investment' || !poolId || !userId) {
    return;
  }

  console.log(`Processing canceled payment for pool ${poolId}, user ${userId}`);

  // Delete the pending investment record
  await prisma.coInvestmentInvestor.deleteMany({
    where: {
      poolId,
      userId,
      stripePaymentId: paymentIntent.id,
      paymentStatus: 'pending',
    },
  });
}

/**
 * Handle transfer created (for distributions)
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  const { distributionId } = transfer.metadata;

  if (!distributionId) return;

  await prisma.coInvestmentDistribution.update({
    where: { id: distributionId },
    data: {
      status: 'processing',
      stripeTransferId: transfer.id,
    },
  });
}

/**
 * Helper to recalculate all investors' ownership percentages
 */
async function recalculateOwnershipPercentages(poolId: string, totalRaised: number) {
  const investors = await prisma.coInvestmentInvestor.findMany({
    where: { poolId, paymentStatus: 'completed' },
  });

  return investors.map((inv) =>
    prisma.coInvestmentInvestor.update({
      where: { id: inv.id },
      data: {
        ownershipPercent: (inv.amountInvested.toNumber() / totalRaised) * 100,
      },
    })
  );
}

export default router;
