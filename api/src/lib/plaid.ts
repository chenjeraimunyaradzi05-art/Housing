/**
 * Plaid Service for Bank Account Integration
 * Handles account linking, transactions sync, and balance updates
 */
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import config from '../config';

// Initialize Plaid client
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[config.plaid.environment as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': config.plaid.clientId,
      'PLAID-SECRET': config.plaid.secret,
    },
  },
});

export const plaidClient = new PlaidApi(plaidConfig);

/**
 * Create a link token for Plaid Link initialization
 */
export async function createLinkToken(userId: string, accessToken?: string) {
  const request = {
    user: { client_user_id: userId },
    client_name: 'VÖR Platform',
    products: [Products.Transactions] as Products[],
    country_codes: [CountryCode.Us],
    language: 'en',
    ...(accessToken && { access_token: accessToken }), // For update mode
  };

  const response = await plaidClient.linkTokenCreate(request);
  return response.data;
}

/**
 * Exchange public token for access token after user links account
 */
export async function exchangePublicToken(publicToken: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

/**
 * Get account information
 */
export async function getAccounts(accessToken: string) {
  const response = await plaidClient.accountsGet({
    access_token: accessToken,
  });
  return response.data;
}

/**
 * Get account balances
 */
export async function getBalances(accessToken: string, accountIds?: string[]) {
  const response = await plaidClient.accountsBalanceGet({
    access_token: accessToken,
    options: accountIds ? { account_ids: accountIds } : undefined,
  });
  return response.data;
}

/**
 * Get transactions for a date range
 */
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
  options?: {
    accountIds?: string[];
    count?: number;
    offset?: number;
  }
) {
  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: {
      account_ids: options?.accountIds,
      count: options?.count || 500,
      offset: options?.offset || 0,
    },
  });
  return response.data;
}

/**
 * Sync transactions (incremental sync)
 */
export async function syncTransactions(accessToken: string, cursor?: string) {
  const response = await plaidClient.transactionsSync({
    access_token: accessToken,
    cursor: cursor || undefined,
  });
  return response.data;
}

/**
 * Get institution details
 */
export async function getInstitution(institutionId: string) {
  const response = await plaidClient.institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us],
    options: {
      include_optional_metadata: true,
    },
  });
  return response.data.institution;
}

/**
 * Remove an item (unlink account)
 */
export async function removeItem(accessToken: string) {
  const response = await plaidClient.itemRemove({
    access_token: accessToken,
  });
  return response.data;
}

/**
 * Get item status
 */
export async function getItemStatus(accessToken: string) {
  const response = await plaidClient.itemGet({
    access_token: accessToken,
  });
  return response.data;
}

/**
 * Create a sandbox public token for testing
 */
export async function createSandboxPublicToken(institutionId: string = 'ins_109508') {
  if (config.plaid.environment !== 'sandbox') {
    throw new Error('Sandbox tokens can only be created in sandbox environment');
  }

  const response = await plaidClient.sandboxPublicTokenCreate({
    institution_id: institutionId,
    initial_products: [Products.Transactions],
  });
  return response.data.public_token;
}

/**
 * Verify webhook signature
 */
export function verifyWebhook(body: string, headers: Record<string, string>): boolean {
  // In production, implement proper webhook verification
  // using Plaid's webhook verification endpoint
  const webhookCode = headers['plaid-verification'];
  return !!webhookCode;
}

/**
 * Map Plaid account type to our internal type
 */
export function mapAccountType(plaidType: string, plaidSubtype?: string): string {
  const typeMap: Record<string, string> = {
    depository: plaidSubtype === 'savings' ? 'savings' : 'checking',
    credit: 'credit',
    loan: 'loan',
    investment: 'investment',
    brokerage: 'investment',
    other: 'other',
  };
  return typeMap[plaidType.toLowerCase()] || 'other';
}

/**
 * Map Plaid category to our internal category
 */
export function mapCategory(plaidCategory: string[]): { category: string; subcategory?: string } {
  if (!plaidCategory || plaidCategory.length === 0) {
    return { category: 'Other' };
  }

  const categoryMap: Record<string, string> = {
    'Food and Drink': 'Food & Dining',
    'Travel': 'Travel',
    'Shops': 'Shopping',
    'Recreation': 'Entertainment',
    'Service': 'Bills & Utilities',
    'Transfer': 'Transfers',
    'Payment': 'Bills & Utilities',
    'Bank Fees': 'Fees',
    'Interest': 'Income',
    'Tax': 'Taxes',
    'Healthcare': 'Health',
    'Personal Care': 'Personal Care',
    'Transportation': 'Transportation',
    'Community': 'Gifts & Donations',
  };

  const primaryCategory = plaidCategory[0];
  const mappedCategory = categoryMap[primaryCategory] || primaryCategory;
  const subcategory = plaidCategory.length > 1 ? plaidCategory[1] : undefined;

  return { category: mappedCategory, subcategory };
}

export default {
  plaidClient,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getBalances,
  getTransactions,
  syncTransactions,
  getInstitution,
  removeItem,
  getItemStatus,
  createSandboxPublicToken,
  verifyWebhook,
  mapAccountType,
  mapCategory,
};
