'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, Spinner, Badge } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import Layout from '@/components/ui/Layout';

// ==================== TYPES ====================

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  monthlyRent?: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
}

interface FinancialMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualIncome: number;
  annualExpenses: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  grossRentMultiplier: number;
  pricePerSqFt: number;
}

interface MaintenanceSummary {
  total: number;
  pending: number;
  completed: number;
  totalCost: number;
  byCategory: Array<{ category: string; count: number; cost: number }>;
}

const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4', '#ec4899'];

// Currency formatter for chart tooltips - cast to any to avoid recharts type complexity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatCurrencyTooltip: any = (value: unknown) => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  return `$${numValue.toLocaleString()}`;
};

// ==================== MAIN COMPONENT ====================

export default function PropertyAnalyticsPage() {
  const params = useParams();
  const propertyId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);

  // Simulated data - in production, fetch from API
  const [cashFlowData] = useState([
    { month: 'Jan', income: 2500, expenses: 1800, cashFlow: 700 },
    { month: 'Feb', income: 2500, expenses: 1750, cashFlow: 750 },
    { month: 'Mar', income: 2500, expenses: 2100, cashFlow: 400 },
    { month: 'Apr', income: 2500, expenses: 1800, cashFlow: 700 },
    { month: 'May', income: 2500, expenses: 1850, cashFlow: 650 },
    { month: 'Jun', income: 2500, expenses: 1780, cashFlow: 720 },
    { month: 'Jul', income: 2600, expenses: 1800, cashFlow: 800 },
    { month: 'Aug', income: 2600, expenses: 1900, cashFlow: 700 },
    { month: 'Sep', income: 2600, expenses: 1820, cashFlow: 780 },
    { month: 'Oct', income: 2600, expenses: 1850, cashFlow: 750 },
    { month: 'Nov', income: 2600, expenses: 1800, cashFlow: 800 },
    { month: 'Dec', income: 2600, expenses: 2200, cashFlow: 400 },
  ]);

  const [expenseBreakdown] = useState([
    { name: 'Mortgage', value: 1200 },
    { name: 'Property Tax', value: 300 },
    { name: 'Insurance', value: 150 },
    { name: 'Maintenance', value: 100 },
    { name: 'Management', value: 200 },
    { name: 'Utilities', value: 50 },
  ]);

  const [equityGrowth] = useState([
    { year: '2020', equity: 80000, value: 350000 },
    { year: '2021', equity: 95000, value: 380000 },
    { year: '2022', equity: 115000, value: 420000 },
    { year: '2023', equity: 140000, value: 460000 },
    { year: '2024', equity: 165000, value: 500000 },
  ]);

  const [maintenanceHistory] = useState([
    { month: 'Jan', cost: 150, count: 1 },
    { month: 'Feb', cost: 0, count: 0 },
    { month: 'Mar', cost: 450, count: 2 },
    { month: 'Apr', cost: 100, count: 1 },
    { month: 'May', cost: 200, count: 1 },
    { month: 'Jun', cost: 0, count: 0 },
    { month: 'Jul', cost: 300, count: 2 },
    { month: 'Aug', cost: 150, count: 1 },
    { month: 'Sep', cost: 0, count: 0 },
    { month: 'Oct', cost: 100, count: 1 },
    { month: 'Nov', cost: 0, count: 0 },
    { month: 'Dec', cost: 500, count: 2 },
  ]);

  const metrics: FinancialMetrics = {
    monthlyIncome: 2600,
    monthlyExpenses: 2000,
    monthlyCashFlow: 600,
    annualIncome: 31200,
    annualExpenses: 24000,
    annualCashFlow: 7200,
    capRate: 5.2,
    cashOnCashReturn: 8.5,
    grossRentMultiplier: 12.8,
    pricePerSqFt: 285,
  };

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}`);
      const data = await response.json();
      if (data.success) {
        setProperty(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, fetchProperty]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'equity', label: 'Equity & Value' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'maintenance', label: 'Maintenance' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Property Analytics
          </h1>
          {property && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {property.title} • {property.address}
            </p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Monthly Cash Flow"
            value={`$${metrics.monthlyCashFlow.toLocaleString()}`}
            trend="+5.2%"
            trendUp
          />
          <MetricCard
            title="Annual Income"
            value={`$${metrics.annualIncome.toLocaleString()}`}
            trend="+3.8%"
            trendUp
          />
          <MetricCard
            title="Cap Rate"
            value={`${metrics.capRate}%`}
            subtitle="Net Operating Income"
          />
          <MetricCard
            title="Cash-on-Cash"
            value={`${metrics.cashOnCashReturn}%`}
            subtitle="Return on Investment"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="equity">Equity & Value</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              metrics={metrics}
              cashFlowData={cashFlowData}
              expenseBreakdown={expenseBreakdown}
            />
          </TabsContent>
          <TabsContent value="cashflow">
            <CashFlowTab data={cashFlowData} metrics={metrics} />
          </TabsContent>
          <TabsContent value="equity">
            <EquityTab data={equityGrowth} />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpensesTab breakdown={expenseBreakdown} cashFlowData={cashFlowData} />
          </TabsContent>
          <TabsContent value="maintenance">
            <MaintenanceTab data={maintenanceHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// ==================== METRIC CARD ====================

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}

function MetricCard({ title, value, trend, trendUp, subtitle }: MetricCardProps) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {trend && (
        <p className={`text-sm mt-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend} vs last year
        </p>
      )}
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  );
}

// ==================== OVERVIEW TAB ====================

interface OverviewTabProps {
  metrics: FinancialMetrics;
  cashFlowData: any[];
  expenseBreakdown: any[];
}

function OverviewTab({ metrics, cashFlowData, expenseBreakdown }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cash Flow Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={formatCurrencyTooltip} />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Expense Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {expenseBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatCurrencyTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Financial Summary */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Gross Rent Multiplier</p>
            <p className="text-xl font-bold">{metrics.grossRentMultiplier}x</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price per Sq Ft</p>
            <p className="text-xl font-bold">${metrics.pricePerSqFt}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Annual Cash Flow</p>
            <p className="text-xl font-bold text-green-600">
              ${metrics.annualCashFlow.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Annual Expenses</p>
            <p className="text-xl font-bold text-red-600">
              ${metrics.annualExpenses.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== CASH FLOW TAB ====================

interface CashFlowTabProps {
  data: any[];
  metrics: FinancialMetrics;
}

function CashFlowTab({ data, metrics }: CashFlowTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={formatCurrencyTooltip} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
              <Bar dataKey="cashFlow" name="Net Cash Flow" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-500">Total Annual Income</p>
          <p className="text-3xl font-bold text-green-600">
            ${metrics.annualIncome.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-500">Total Annual Expenses</p>
          <p className="text-3xl font-bold text-red-600">
            ${metrics.annualExpenses.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-sm text-gray-500">Net Annual Cash Flow</p>
          <p className="text-3xl font-bold text-purple-600">
            ${metrics.annualCashFlow.toLocaleString()}
          </p>
        </Card>
      </div>
    </div>
  );
}

// ==================== EQUITY TAB ====================

interface EquityTabProps {
  data: any[];
}

function EquityTab({ data }: EquityTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Property Value & Equity Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={formatCurrencyTooltip} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                name="Property Value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="equity"
                name="Equity"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Value Appreciation</h3>
          <div className="space-y-4">
            {data.map((item, index) => {
              const prev = index > 0 ? data[index - 1].value : item.value;
              const growth = ((item.value - prev) / prev) * 100;
              return (
                <div key={item.year} className="flex justify-between items-center">
                  <span className="font-medium">{item.year}</span>
                  <div className="text-right">
                    <span className="font-semibold">${item.value.toLocaleString()}</span>
                    {index > 0 && (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        +{growth.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Equity Building</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={formatCurrencyTooltip} />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==================== EXPENSES TAB ====================

interface ExpensesTabProps {
  breakdown: any[];
  cashFlowData: any[];
}

function ExpensesTab({ breakdown, cashFlowData }: ExpensesTabProps) {
  const totalMonthly = breakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatCurrencyTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Details</h3>
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">${item.value}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    ({((item.value / totalMonthly) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total Monthly</span>
              <span>${totalMonthly.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Expenses Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={formatCurrencyTooltip} />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==================== MAINTENANCE TAB ====================

interface MaintenanceTabProps {
  data: any[];
}

function MaintenanceTab({ data }: MaintenanceTabProps) {
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Total Maintenance Cost</p>
          <p className="text-2xl font-bold text-amber-600">${totalCost.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Total Work Orders</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Average Cost per Order</p>
          <p className="text-2xl font-bold">
            ${totalCount > 0 ? Math.round(totalCost / totalCount) : 0}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Maintenance Costs Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={formatCurrencyTooltip} />
              <Bar dataKey="cost" name="Cost" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Work Orders Per Month</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                name="Work Orders"
                stroke="#8b5cf6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
