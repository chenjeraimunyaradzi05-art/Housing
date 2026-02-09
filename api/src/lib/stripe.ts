import Stripe from 'stripe';
import { config } from '../config';

// ==================== STRIPE CLIENT ====================

// Use a placeholder key in development when no key is provided
const stripeKey = config.stripe.secretKey || 'sk_test_placeholder';

export const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, {
      // @ts-expect-error - Using compatible API version
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : (null as unknown as Stripe);

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return Boolean(config.stripe.secretKey);
}

// ==================== TYPES ====================

export interface CreatePaymentIntentParams {
  amount: number; // In cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
  paymentMethodId?: string;
  setupFutureUsage?: 'off_session' | 'on_session';
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateTransferParams {
  amount: number; // In cents
  destination: string; // Connected account ID
  transferGroup?: string;
  metadata?: Record<string, string>;
  description?: string;
}

// ==================== PAYMENT INTENTS ====================

/**
 * Create a payment intent for investment
 */
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  customerId,
  metadata = {},
  description,
  paymentMethodId,
  setupFutureUsage,
}: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentCreateParams = {
    amount,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  };

  if (customerId) {
    params.customer = customerId;
  }

  if (description) {
    params.description = description;
  }

  if (paymentMethodId) {
    params.payment_method = paymentMethodId;
    params.confirm = true;
  }

  if (setupFutureUsage) {
    params.setup_future_usage = setupFutureUsage;
  }

  return stripe.paymentIntents.create(params);
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return null;
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentConfirmParams = {};

  if (paymentMethodId) {
    params.payment_method = paymentMethodId;
  }

  return stripe.paymentIntents.confirm(paymentIntentId, params);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch {
    return null;
  }
}

/**
 * Create a refund for a payment intent
 */
export async function createRefund({
  paymentIntentId,
  amount,
  reason,
  metadata = {},
}: {
  paymentIntentId: string;
  amount?: number; // In cents, optional for full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
    metadata,
  });
}

// ==================== CUSTOMERS ====================

/**
 * Create a Stripe customer
 */
export async function createCustomer({
  email,
  name,
  metadata = {},
}: CreateCustomerParams): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

/**
 * Retrieve a customer by ID
 */
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

/**
 * Update a customer
 */
export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, params);
}

// ==================== TRANSFERS ====================

/**
 * Create a transfer to a connected account (for distributions)
 */
export async function createTransfer({
  amount,
  destination,
  transferGroup,
  metadata = {},
  description,
}: CreateTransferParams): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount,
    currency: 'usd',
    destination,
    transfer_group: transferGroup,
    metadata,
    description,
  });
}

/**
 * Retrieve a transfer by ID
 */
export async function getTransfer(
  transferId: string
): Promise<Stripe.Transfer | null> {
  try {
    return await stripe.transfers.retrieve(transferId);
  } catch {
    return null;
  }
}

// ==================== WEBHOOKS ====================

/**
 * Construct and verify a webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
}

// ==================== PAYMENT METHODS ====================

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<Stripe.PaymentMethod[]> {
  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type,
  });
  return methods.data;
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return stripe.paymentMethods.detach(paymentMethodId);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert dollars to cents
 */
export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(amount: number): number {
  return amount / 100;
}

/**
 * Format amount for display
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(centsToDollars(cents));
}
