'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Spinner, Button } from '@/components/ui';

interface FinancialSummary {
  netWorth: number;
  totalAssets: number;
  totalDebt: number;
  cashFlow: {
    income: number;
    expenses: number;
    net: number;
  };
  accounts: {
    count: number;
    checking: number;
    savings: number;
    credit: number;
    investment: number;
  };
  budgets: {
    total: number;
    overBudget: number;
    percentUsed: number;
  };
  recentTransactions: Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
    category?: string;
  }>;
  topExpenses: Array<{
    category: string;
    amount: number;
    percent: number;
  }>;
}

export default function FinancialDashboardPage() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch multiple endpoints in parallel
      const [accountsRes, transactionsRes, budgetsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch(`/api/transactions/summary?period=${period}`),
        fetch('/api/budgets/summary'),
      ]);

      const [accountsData, transactionsData, budgetsData] = await Promise.all([
        accountsRes.json(),
        transactionsRes.json(),
        budgetsRes.json(),
      ]);

      // Also fetch recent transactions
      const recentRes = await fetch('/api/transactions?limit=5');
      const recentData = await recentRes.json();

      // Compile dashboard data
      const summary: FinancialSummary = {
        netWorth: accountsData.data?.summary?.netWorth || 0,
        totalAssets: accountsData.data?.summary?.totalAssets || 0,
        totalDebt: accountsData.data?.summary?.totalDebt || 0,
        cashFlow: {
          income: transactionsData.data?.totalIncome || 0,
          expenses: transactionsData.data?.totalExpenses || 0,
          net: transactionsData.data?.netCashFlow || 0,
        },
        accounts: {
          count: accountsData.data?.summary?.totalAccounts || 0,
          checking: accountsData.data?.accounts?.filter((a: { type: string }) => a.type === 'checking').length || 0,
          savings: accountsData.data?.accounts?.filter((a: { type: string }) => a.type === 'savings').length || 0,
          credit: accountsData.data?.accounts?.filter((a: { type: string }) => a.type === 'credit').length || 0,
          investment: accountsData.data?.accounts?.filter((a: { type: string }) => a.type === 'investment').length || 0,
        },
        budgets: {
          total: budgetsData.data?.activeBudgets || 0,
          overBudget: budgetsData.data?.overBudgetCount || 0,
          percentUsed: budgetsData.data?.percentUsed || 0,
        },
        recentTransactions: recentData.data?.transactions || [],
        topExpenses: (transactionsData.data?.byCategory || [])
          .filter((c: { amount: number }) => c.amount > 0)
          .slice(0, 5)
          .map((c: { category: string; amount: number }, _: number, arr: Array<{ amount: number }>) => ({
            category: c.category,
            amount: c.amount,
            percent: Math.round((c.amount / arr.reduce((s, x) => s + x.amount, 0)) * 100),
          })),
      };

      setData(summary);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Unable to load financial data</h1>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your complete financial overview
          </p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-full ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Net Worth Hero */}
      <Card className="p-8 mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <p className="text-sm opacity-90 mb-1">Net Worth</p>
        <p className="text-5xl font-bold mb-4">
          ${data.netWorth.toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <p className="text-sm opacity-90">Total Assets</p>
            <p className="text-2xl font-semibold">${data.totalAssets.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Total Debt</p>
            <p className="text-2xl font-semibold">${data.totalDebt.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Cash Flow */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cash Flow</h3>
            <span className="text-2xl">💸</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Income</span>
              <span className="text-green-600 font-medium">+${data.cashFlow.income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Expenses</span>
              <span className="text-red-600 font-medium">-${data.cashFlow.expenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="font-medium">Net</span>
              <span className={`font-bold ${data.cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.cashFlow.net >= 0 ? '+' : ''}${data.cashFlow.net.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Accounts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Accounts</h3>
            <span className="text-2xl">🏦</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {data.accounts.count}
          </p>
          <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
            {data.accounts.checking > 0 && <span>{data.accounts.checking} checking</span>}
            {data.accounts.savings > 0 && <span>{data.accounts.savings} savings</span>}
            {data.accounts.credit > 0 && <span>{data.accounts.credit} credit</span>}
          </div>
          <Link href="/dashboard/accounts">
            <Button variant="ghost" size="sm" className="mt-4">
              Manage Accounts →
            </Button>
          </Link>
        </Card>

        {/* Budgets */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Budgets</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Used</span>
              <span className="font-medium">{data.budgets.percentUsed}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  data.budgets.percentUsed >= 100 ? 'bg-red-500' :
                  data.budgets.percentUsed >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, data.budgets.percentUsed)}%` }}
              />
            </div>
          </div>
          {data.budgets.overBudget > 0 && (
            <p className="text-sm text-red-600 mb-2">
              ⚠️ {data.budgets.overBudget} over budget
            </p>
          )}
          <Link href="/dashboard/budgets">
            <Button variant="ghost" size="sm">
              View Budgets →
            </Button>
          </Link>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/dashboard/accounts" className="block">
              <Button variant="outline" className="w-full justify-start">
                ➕ Link Account
              </Button>
            </Link>
            <Link href="/dashboard/budgets" className="block">
              <Button variant="outline" className="w-full justify-start">
                💰 Create Budget
              </Button>
            </Link>
            <Link href="/dashboard/transactions" className="block">
              <Button variant="outline" className="w-full justify-start">
                📋 View Transactions
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </div>
          {data.recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent transactions</p>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tx.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()} • {tx.category || 'Uncategorized'}
                    </p>
                  </div>
                  <p className={`font-semibold ${tx.amount < 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                    {tx.amount < 0 ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Expenses */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Spending Categories</h3>
          {data.topExpenses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No expense data available</p>
          ) : (
            <div className="space-y-4">
              {data.topExpenses.map((expense, index) => (
                <div key={expense.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 dark:text-white">{expense.category}</span>
                    <span className="text-gray-600">${expense.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${expense.percent}%`,
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
