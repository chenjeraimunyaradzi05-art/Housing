'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Spinner, Modal } from '@/components/ui';

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  institutionName?: string;
  institutionLogo?: string;
  mask?: string;
  currentBalance: number;
  availableBalance?: number;
  status: string;
  isManual: boolean;
  lastSynced?: string;
}

interface AccountSummary {
  totalAccounts: number;
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data.accounts);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncAccounts() {
    setSyncing(true);
    try {
      await fetch('/api/accounts/sync', { method: 'POST' });
      await fetchAccounts();
    } catch (error) {
      console.error('Failed to sync accounts:', error);
    } finally {
      setSyncing(false);
    }
  }

  async function initPlaidLink() {
    try {
      const res = await fetch('/api/accounts/link-token');
      const data = await res.json();
      if (data.success) {
        // In production, this would open Plaid Link
        console.log('Link token:', data.data.linkToken);
        alert('Plaid Link would open here with token: ' + data.data.linkToken.substring(0, 20) + '...');
      }
    } catch (error) {
      console.error('Failed to get link token:', error);
    }
  }

  function getAccountIcon(type: string) {
    switch (type) {
      case 'checking':
        return '🏦';
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'loan':
        return '📋';
      case 'investment':
        return '📈';
      default:
        return '💵';
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'disconnected':
        return <Badge variant="warning">Disconnected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Linked Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your connected bank accounts and track your finances
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={syncAccounts} disabled={syncing}>
            {syncing ? <Spinner size="sm" /> : '🔄'} Sync All
          </Button>
          <Button onClick={() => initPlaidLink()}>
            ➕ Link Account
          </Button>
        </div>
      </div>

      {/* Net Worth Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-sm opacity-90">Net Worth</p>
            <p className="text-3xl font-bold mt-1">
              ${summary.netWorth.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              ${summary.totalAssets.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Debt</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">
              ${summary.totalDebt.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Accounts</p>
            <p className="text-2xl font-semibold mt-1">{summary.totalAccounts}</p>
          </Card>
        </div>
      )}

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🏦</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No accounts linked yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Link your bank accounts to start tracking your finances automatically
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => initPlaidLink()}>
              Link Bank Account
            </Button>
            <Button variant="outline" onClick={() => setShowManualModal(true)}>
              Add Manual Account
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Group by institution */}
          {Object.entries(
            accounts.reduce((acc, account) => {
              const institution = account.institutionName || 'Manual Accounts';
              if (!acc[institution]) acc[institution] = [];
              acc[institution].push(account);
              return acc;
            }, {} as Record<string, Account[]>)
          ).map(([institution, institutionAccounts]) => (
            <div key={institution}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                {institutionAccounts[0]?.institutionLogo ? (
                  <img
                    src={institutionAccounts[0].institutionLogo}
                    alt={institution}
                    className="w-6 h-6 rounded"
                  />
                ) : (
                  <span>🏛️</span>
                )}
                {institution}
              </h3>
              <div className="grid gap-4">
                {institutionAccounts.map((account) => (
                  <Card key={account.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{getAccountIcon(account.type)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {account.name}
                            </h4>
                            {account.mask && (
                              <span className="text-sm text-gray-500">•••• {account.mask}</span>
                            )}
                            {getStatusBadge(account.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {account.subtype || account.type}
                            {account.isManual && ' • Manual'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xl font-semibold ${
                            account.type === 'credit' || account.type === 'loan'
                              ? 'text-red-600'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {account.type === 'credit' || account.type === 'loan' ? '-' : ''}$
                          {Math.abs(account.currentBalance).toLocaleString()}
                        </p>
                        {account.availableBalance !== undefined &&
                          account.availableBalance !== account.currentBalance && (
                            <p className="text-sm text-gray-500">
                              Available: ${account.availableBalance.toLocaleString()}
                            </p>
                          )}
                        {account.lastSynced && (
                          <p className="text-xs text-gray-400 mt-1">
                            Synced {new Date(account.lastSynced).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <Link href={`/dashboard/transactions?accountId=${account.id}`}>
                        <Button variant="ghost" size="sm">
                          View Transactions
                        </Button>
                      </Link>
                      {account.status === 'error' && (
                        <Button variant="ghost" size="sm" className="text-amber-600">
                          Reconnect
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Account Modal */}
      <Modal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Add Manual Account"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);

            try {
              const res = await fetch('/api/accounts/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: formData.get('name'),
                  type: formData.get('type'),
                  currentBalance: parseFloat(formData.get('balance') as string) || 0,
                  institutionName: formData.get('institution'),
                }),
              });

              if (res.ok) {
                setShowManualModal(false);
                fetchAccounts();
              }
            } catch (error) {
              console.error('Failed to create account:', error);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Account Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="e.g., Emergency Fund"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account Type</label>
            <select
              name="type"
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit Card</option>
              <option value="loan">Loan</option>
              <option value="investment">Investment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Balance</label>
            <input
              name="balance"
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Institution (Optional)</label>
            <input
              name="institution"
              type="text"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              placeholder="e.g., Chase, Wells Fargo"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowManualModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
