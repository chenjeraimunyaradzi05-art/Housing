'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge, Spinner, Modal, Input, Select } from '@/components/ui';

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  percentUsed: number;
  remaining: number;
  period: string;
  color: string;
  icon?: string;
  rollover: boolean;
  alertEnabled: boolean;
  alertThreshold: number;
  status: string;
  isOverBudget: boolean;
  periodStart: string;
  periodEnd: string;
}

interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  activeBudgets: number;
  overBudgetCount: number;
}

const BUDGET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1',
];

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Travel',
  'Health',
  'Personal Care',
  'Groceries',
  'Subscriptions',
  'Education',
  'Gifts & Donations',
  'Home',
  'Other',
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    fetchBudgets();
    fetchSummary();
  }, []);

  async function fetchBudgets() {
    try {
      const res = await fetch('/api/budgets');
      const data = await res.json();
      if (data.success) {
        setBudgets(data.data.budgets);
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      const res = await fetch('/api/budgets/summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }

  async function createBudget(formData: FormData) {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          category: formData.get('category'),
          amount: parseFloat(formData.get('amount') as string),
          period: formData.get('period'),
          color: formData.get('color'),
          rollover: formData.get('rollover') === 'on',
          alertEnabled: formData.get('alertEnabled') !== 'off',
          alertThreshold: parseInt(formData.get('alertThreshold') as string) || 80,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchBudgets();
        fetchSummary();
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  }

  async function deleteBudget(id: string) {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      fetchBudgets();
      fetchSummary();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  }

  function getProgressColor(percent: number): string {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
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
            Budgets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set spending limits and track your progress
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          ➕ Create Budget
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Budgeted</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
              ${summary.totalBudgeted.toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">
              ${summary.totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{summary.percentUsed}% of budget</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
            <p className={`text-2xl font-semibold mt-1 ${summary.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(summary.totalRemaining).toLocaleString()}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Over Budget</p>
            <p className={`text-2xl font-semibold mt-1 ${summary.overBudgetCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.overBudgetCount} / {summary.activeBudgets}
            </p>
          </Card>
        </div>
      )}

      {/* Overall Progress */}
      {summary && summary.totalBudgeted > 0 && (
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Overall Budget Progress</h3>
            <span className="text-sm text-gray-600">
              ${summary.totalSpent.toLocaleString()} / ${summary.totalBudgeted.toLocaleString()}
            </span>
          </div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(summary.percentUsed)}`}
              style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No budgets yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create budgets to track your spending by category
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Budget
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <Card key={budget.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: budget.color }}
                  >
                    {budget.icon || budget.category.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {budget.name}
                    </h3>
                    <p className="text-sm text-gray-500">{budget.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {budget.isOverBudget && (
                    <Badge variant="error">Over</Badge>
                  )}
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    ${budget.spent.toLocaleString()} spent
                  </span>
                  <span className="font-medium">
                    ${budget.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full`}
                    style={{
                      width: `${Math.min(100, budget.percentUsed)}%`,
                      backgroundColor: budget.percentUsed >= 100 ? '#EF4444' : budget.color,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className={`font-semibold ${budget.remaining < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    ${Math.abs(budget.remaining).toLocaleString()}
                    {budget.remaining < 0 && ' over'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Period</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {budget.period}
                  </p>
                </div>
              </div>

              {/* Settings indicators */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                {budget.rollover && (
                  <Badge variant="outline" className="text-xs">Rollover</Badge>
                )}
                {budget.alertEnabled && (
                  <Badge variant="outline" className="text-xs">Alert at {budget.alertThreshold}%</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Budget"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBudget(new FormData(e.target as HTMLFormElement));
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Budget Name</label>
            <Input
              name="name"
              required
              placeholder="e.g., Monthly Groceries"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              name="category"
              required
              placeholder="Select category"
              options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Budget Amount</label>
            <Input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="500.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <Select
              name="period"
              defaultValue="monthly"
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {BUDGET_COLORS.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={color === '#3B82F6'}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-300 peer-checked:border-gray-900"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="rollover" className="rounded" />
              <span className="text-sm">Roll over unused amount</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="alertEnabled" defaultChecked className="rounded" />
              <span className="text-sm">Enable alerts</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alert Threshold (%)</label>
            <Input
              name="alertThreshold"
              type="number"
              min="1"
              max="100"
              defaultValue="80"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
