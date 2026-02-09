'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Badge, Spinner, Input, Select } from '@/components/ui';

interface Transaction {
  id: string;
  name: string;
  merchantName?: string;
  amount: number;
  date: string;
  pending: boolean;
  category?: string;
  personalCategory?: string;
  subcategory?: string;
  notes?: string;
  tags: string[];
  account: {
    id: string;
    name: string;
    type: string;
    institutionName?: string;
  };
}

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Travel',
  'Health',
  'Personal Care',
  'Income',
  'Transfers',
  'Fees',
  'Other',
];

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [showPending, setShowPending] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (!showPending) params.set('pending', 'false');
      params.set('page', page.toString());
      params.set('limit', '50');

      // Date range
      if (dateRange !== 'all') {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      // Account filter from URL
      const accountId = searchParams.get('accountId');
      if (accountId) params.set('accountId', accountId);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data.transactions);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [search, category, dateRange, showPending, page, searchParams]);

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const res = await fetch(`/api/transactions/summary?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  async function categorizeTransaction(txId: string, newCategory: string) {
    try {
      await fetch(`/api/transactions/${txId}/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      fetchTransactions();
    } catch (error) {
      console.error('Failed to categorize:', error);
    }
  }

  function getCategoryColor(category?: string): string {
    const colors: Record<string, string> = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Bills & Utilities': 'bg-yellow-100 text-yellow-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Travel': 'bg-cyan-100 text-cyan-800',
      'Health': 'bg-red-100 text-red-800',
      'Income': 'bg-green-100 text-green-800',
      'Transfers': 'bg-gray-100 text-gray-800',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and categorize your transactions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              +${summary.totalIncome.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">
              -${summary.totalExpenses.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Cash Flow</p>
            <p className={`text-2xl font-semibold mt-1 ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.netCashFlow >= 0 ? '+' : ''} ${summary.netCashFlow.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              {summary.transactionCount}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="All Categories"
            options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          />
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' },
              { value: 'all', label: 'All time' },
            ]}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPending}
              onChange={(e) => setShowPending(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show pending</span>
          </label>
        </div>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No transactions found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or link a bank account to see transactions
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">
                    {tx.amount < 0 ? '💰' : '🛒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {tx.merchantName || tx.name}
                      </h4>
                      {tx.pending && (
                        <Badge variant="warning" className="text-xs">Pending</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{tx.account.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Category selector */}
                  <select
                    value={tx.personalCategory || tx.category || ''}
                    onChange={(e) => categorizeTransaction(tx.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full border-0 ${getCategoryColor(tx.personalCategory || tx.category)}`}
                  >
                    <option value="">Uncategorized</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Amount */}
                  <p className={`text-lg font-semibold min-w-[100px] text-right ${
                    tx.amount < 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {tx.amount < 0 ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {tx.tags && tx.tags.length > 0 && (
                <div className="flex gap-1 mt-2 ml-14">
                  {tx.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && summary.byCategory.length > 0 && (
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {summary.byCategory
              .filter(c => c.amount > 0)
              .slice(0, 8)
              .map((cat) => (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="w-32 truncate text-sm">{cat.category}</div>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (cat.amount / summary.totalExpenses) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium">
                    ${cat.amount.toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
