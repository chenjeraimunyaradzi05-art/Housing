'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, Input, Button, Spinner } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import Layout from '@/components/ui/Layout';

// ==================== TYPES ====================

interface MortgageResult {
  inputs: {
    propertyPrice: number;
    downPayment: number;
    downPaymentPercent: number;
    loanAmount: number;
    loanTerm: number;
    interestRate: number;
  };
  monthlyBreakdown: {
    principalAndInterest: number;
    propertyTax: number;
    homeInsurance: number;
    pmi: number;
    hoaFees: number;
    total: number;
  };
  totals: {
    totalPayments: number;
    totalInterest: number;
    totalPrincipal: number;
  };
  amortizationSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    totalInterest: number;
    totalPrincipal: number;
  }>;
}

interface AffordabilityResult {
  inputs: Record<string, number>;
  results: {
    maxHomePrice: number;
    maxLoanAmount: number;
    estimatedMonthlyPayment: number;
    monthlyBudget: number;
    dtiRatio: number;
  };
  breakdown: {
    grossMonthlyIncome: number;
    maxHousingPayment: number;
    existingDebts: number;
  };
}

interface ROIResult {
  investment: Record<string, number>;
  monthlyAnalysis: Record<string, number>;
  annualAnalysis: Record<string, number>;
  returns: {
    cashOnCashReturn: number;
    capRate: number;
    totalROI: number;
    annualizedROI: number;
  };
  projection: Record<string, number>;
}

// ==================== CALCULATOR COMPONENT ====================

export default function CalculatorPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Calculators
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Plan your real estate investments with our comprehensive calculators
          </p>
        </div>

        <Tabs defaultValue="mortgage" className="w-full">
          <TabsList>
            <TabsTrigger value="mortgage">Mortgage Calculator</TabsTrigger>
            <TabsTrigger value="affordability">Affordability</TabsTrigger>
            <TabsTrigger value="roi">Investment ROI</TabsTrigger>
            <TabsTrigger value="rent-vs-buy">Rent vs Buy</TabsTrigger>
          </TabsList>

          <TabsContent value="mortgage">
            <MortgageCalculator />
          </TabsContent>
          <TabsContent value="affordability">
            <AffordabilityCalculator />
          </TabsContent>
          <TabsContent value="roi">
            <ROICalculator />
          </TabsContent>
          <TabsContent value="rent-vs-buy">
            <RentVsBuyCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// ==================== MORTGAGE CALCULATOR ====================

function MortgageCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [form, setForm] = useState({
    propertyPrice: 400000,
    downPayment: 80000,
    loanTerm: 30,
    interestRate: 6.5,
    propertyTax: 4800,
    homeInsurance: 1800,
    pmi: 150,
    hoaFees: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator/mortgage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

  const pieData = result
    ? [
        { name: 'Principal & Interest', value: result.monthlyBreakdown.principalAndInterest },
        { name: 'Property Tax', value: result.monthlyBreakdown.propertyTax },
        { name: 'Insurance', value: result.monthlyBreakdown.homeInsurance },
        { name: 'PMI', value: result.monthlyBreakdown.pmi },
        { name: 'HOA', value: result.monthlyBreakdown.hoaFees },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Loan Details</h3>
        <div className="space-y-4">
          <Input
            label="Property Price ($)"
            name="propertyPrice"
            type="number"
            value={form.propertyPrice}
            onChange={handleChange}
          />
          <Input
            label="Down Payment ($)"
            name="downPayment"
            type="number"
            value={form.downPayment}
            onChange={handleChange}
          />
          <Input
            label="Loan Term (years)"
            name="loanTerm"
            type="number"
            value={form.loanTerm}
            onChange={handleChange}
          />
          <Input
            label="Interest Rate (%)"
            name="interestRate"
            type="number"
            step="0.1"
            value={form.interestRate}
            onChange={handleChange}
          />
          <Input
            label="Annual Property Tax ($)"
            name="propertyTax"
            type="number"
            value={form.propertyTax}
            onChange={handleChange}
          />
          <Input
            label="Annual Home Insurance ($)"
            name="homeInsurance"
            type="number"
            value={form.homeInsurance}
            onChange={handleChange}
          />
          <Input
            label="Monthly PMI ($)"
            name="pmi"
            type="number"
            value={form.pmi}
            onChange={handleChange}
          />
          <Input
            label="Monthly HOA Fees ($)"
            name="hoaFees"
            type="number"
            value={form.hoaFees}
            onChange={handleChange}
          />
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <Spinner size="sm" /> : 'Calculate'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Payment Breakdown</h3>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-purple-600">
                ${result.monthlyBreakdown.total.toLocaleString()}
              </p>
              <p className="text-gray-500">per month</p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Payments:</span>
                <span className="font-semibold">
                  ${result.totals.totalPayments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Interest:</span>
                <span className="font-semibold text-red-600">
                  ${result.totals.totalInterest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Loan Amount:</span>
                <span className="font-semibold">
                  ${result.inputs.loanAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Amortization Chart */}
          <Card className="p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Amortization Schedule</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.amortizationSchedule}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(month) => `Y${Math.ceil(month / 12)}`}
                  />
                  <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Loan Balance"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalPrincipal"
                    name="Total Principal Paid"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalInterest"
                    name="Total Interest Paid"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ==================== AFFORDABILITY CALCULATOR ====================

function AffordabilityCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AffordabilityResult | null>(null);
  const [form, setForm] = useState({
    annualIncome: 120000,
    monthlyDebts: 500,
    downPayment: 60000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    maxDtiRatio: 36,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator/affordability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Finances</h3>
        <div className="space-y-4">
          <Input
            label="Annual Income ($)"
            name="annualIncome"
            type="number"
            value={form.annualIncome}
            onChange={handleChange}
          />
          <Input
            label="Monthly Debts ($)"
            name="monthlyDebts"
            type="number"
            value={form.monthlyDebts}
            onChange={handleChange}
          />
          <Input
            label="Down Payment ($)"
            name="downPayment"
            type="number"
            value={form.downPayment}
            onChange={handleChange}
          />
          <Input
            label="Interest Rate (%)"
            name="interestRate"
            type="number"
            step="0.1"
            value={form.interestRate}
            onChange={handleChange}
          />
          <Input
            label="Loan Term (years)"
            name="loanTerm"
            type="number"
            value={form.loanTerm}
            onChange={handleChange}
          />
          <Input
            label="Max DTI Ratio (%)"
            name="maxDtiRatio"
            type="number"
            value={form.maxDtiRatio}
            onChange={handleChange}
          />
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <Spinner size="sm" /> : 'Calculate Affordability'}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Home Buying Power</h3>
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-green-600">
              ${result.results.maxHomePrice.toLocaleString()}
            </p>
            <p className="text-gray-500 mt-1">Maximum Home Price</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Max Loan Amount
                </span>
                <span className="font-semibold">
                  ${result.results.maxLoanAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Monthly Payment
                </span>
                <span className="font-semibold">
                  ${result.results.estimatedMonthlyPayment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Monthly Budget
                </span>
                <span className="font-semibold">
                  ${result.results.monthlyBudget.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Income Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gross Monthly Income</span>
                  <span>${result.breakdown.grossMonthlyIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Housing Payment ({form.maxDtiRatio}% DTI)</span>
                  <span>${result.breakdown.maxHousingPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Existing Debts</span>
                  <span>-${result.breakdown.existingDebts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ==================== ROI CALCULATOR ====================

function ROICalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ROIResult | null>(null);
  const [form, setForm] = useState({
    purchasePrice: 350000,
    downPayment: 70000,
    closingCosts: 8000,
    renovationCosts: 15000,
    monthlyRent: 2500,
    vacancyRate: 5,
    propertyManagement: 8,
    maintenanceReserve: 5,
    propertyTax: 4200,
    insurance: 1800,
    hoaFees: 0,
    interestRate: 6.5,
    loanTerm: 30,
    appreciationRate: 3,
    holdingPeriod: 10,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Investment Details</h3>
        <div className="space-y-3">
          <Input
            label="Purchase Price ($)"
            name="purchasePrice"
            type="number"
            value={form.purchasePrice}
            onChange={handleChange}
          />
          <Input
            label="Down Payment ($)"
            name="downPayment"
            type="number"
            value={form.downPayment}
            onChange={handleChange}
          />
          <Input
            label="Closing Costs ($)"
            name="closingCosts"
            type="number"
            value={form.closingCosts}
            onChange={handleChange}
          />
          <Input
            label="Renovation Costs ($)"
            name="renovationCosts"
            type="number"
            value={form.renovationCosts}
            onChange={handleChange}
          />
          <Input
            label="Monthly Rent ($)"
            name="monthlyRent"
            type="number"
            value={form.monthlyRent}
            onChange={handleChange}
          />
          <Input
            label="Vacancy Rate (%)"
            name="vacancyRate"
            type="number"
            value={form.vacancyRate}
            onChange={handleChange}
          />
          <Input
            label="Property Management (%)"
            name="propertyManagement"
            type="number"
            value={form.propertyManagement}
            onChange={handleChange}
          />
          <Input
            label="Holding Period (years)"
            name="holdingPeriod"
            type="number"
            value={form.holdingPeriod}
            onChange={handleChange}
          />
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <Spinner size="sm" /> : 'Calculate ROI'}
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Returns Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {result.returns.cashOnCashReturn.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cash-on-Cash Return
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {result.returns.capRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cap Rate
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {result.returns.annualizedROI.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Annualized ROI
                </p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {result.returns.totalROI.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total ROI
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Monthly Cash Flow</h4>
              <div className="flex justify-between text-sm">
                <span>Effective Rent</span>
                <span className="text-green-600">
                  +${result.monthlyAnalysis.effectiveRent?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Expenses</span>
                <span className="text-red-600">
                  -${result.monthlyAnalysis.totalExpenses?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Net Cash Flow</span>
                <span
                  className={
                    result.monthlyAnalysis.cashFlow >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  ${result.monthlyAnalysis.cashFlow?.toLocaleString()}/mo
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {form.holdingPeriod}-Year Projection
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cash Invested</span>
                <span className="font-semibold">
                  ${result.investment.totalCashInvested?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Future Property Value</span>
                <span className="font-semibold text-green-600">
                  ${result.projection.futureValue?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Appreciation</span>
                <span className="font-semibold text-green-600">
                  ${result.projection.totalAppreciation?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cash Flow</span>
                <span className="font-semibold text-green-600">
                  ${result.projection.totalCashFlow?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-semibold">Total Return</span>
                <span className="font-bold text-purple-600">
                  ${result.projection.totalReturn?.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ==================== RENT VS BUY CALCULATOR ====================

interface RentVsBuyResult {
  inputs: Record<string, number>;
  summary: {
    buyingNetWorth: number;
    rentingNetWorth: number;
    advantage: 'buying' | 'renting';
    advantageAmount: number;
    breakEvenYear: number | null;
  };
  monthlyComparison: {
    buying: {
      mortgage: number;
      taxes: number;
      insurance: number;
      maintenance: number;
      hoa: number;
      total: number;
    };
    renting: {
      rent: number;
      insurance: number;
      total: number;
    };
  };
  yearlyComparison: Array<{
    year: number;
    buying: { equity: number; cumulativeCost: number };
    renting: { investmentValue: number; cumulativeCost: number };
  }>;
}

function RentVsBuyCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RentVsBuyResult | null>(null);
  const [form, setForm] = useState({
    homePrice: 400000,
    downPayment: 80000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTax: 4800,
    insurance: 1800,
    maintenance: 4000,
    hoaFees: 0,
    homeAppreciation: 3,
    monthlyRent: 2200,
    rentIncrease: 3,
    rentersInsurance: 300,
    investmentReturn: 7,
    timeHorizon: 10,
    taxBracket: 22,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/calculator/rent-vs-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Compare Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h4 className="font-medium text-purple-600 mb-2">Buying</h4>
          </div>
          <Input
            label="Home Price ($)"
            name="homePrice"
            type="number"
            value={form.homePrice}
            onChange={handleChange}
          />
          <Input
            label="Down Payment ($)"
            name="downPayment"
            type="number"
            value={form.downPayment}
            onChange={handleChange}
          />
          <Input
            label="Interest Rate (%)"
            name="interestRate"
            type="number"
            step="0.1"
            value={form.interestRate}
            onChange={handleChange}
          />
          <Input
            label="Appreciation (%/yr)"
            name="homeAppreciation"
            type="number"
            value={form.homeAppreciation}
            onChange={handleChange}
          />

          <div className="col-span-2 border-t pt-4 mt-2">
            <h4 className="font-medium text-green-600 mb-2">Renting</h4>
          </div>
          <Input
            label="Monthly Rent ($)"
            name="monthlyRent"
            type="number"
            value={form.monthlyRent}
            onChange={handleChange}
          />
          <Input
            label="Rent Increase (%/yr)"
            name="rentIncrease"
            type="number"
            value={form.rentIncrease}
            onChange={handleChange}
          />
          <Input
            label="Investment Return (%)"
            name="investmentReturn"
            type="number"
            value={form.investmentReturn}
            onChange={handleChange}
          />
          <Input
            label="Time Horizon (years)"
            name="timeHorizon"
            type="number"
            value={form.timeHorizon}
            onChange={handleChange}
          />
        </div>
        <Button onClick={calculate} disabled={loading} className="w-full mt-4">
          {loading ? <Spinner size="sm" /> : 'Compare'}
        </Button>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recommendation</h3>
            <div className="text-center">
              <div
                className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${
                  result.summary.advantage === 'buying'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30'
                }`}
              >
                {result.summary.advantage === 'buying' ? '🏠 Buying' : '🔑 Renting'}
              </div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                Saves you{' '}
                <span className="font-bold">
                  ${result.summary.advantageAmount.toLocaleString()}
                </span>{' '}
                over {form.timeHorizon} years
              </p>
              {result.summary.breakEvenYear && (
                <p className="text-sm text-gray-500 mt-1">
                  Buying breaks even in year {result.summary.breakEvenYear}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Net Worth Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="buying.equity"
                    name="Home Equity (Buying)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="renting.investmentValue"
                    name="Investment Value (Renting)"
                    stroke="#22c55e"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-purple-600 mb-2">Buying</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Mortgage</span>
                    <span>${result.monthlyComparison.buying.mortgage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>${result.monthlyComparison.buying.taxes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance</span>
                    <span>${result.monthlyComparison.buying.insurance}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total</span>
                    <span>${result.monthlyComparison.buying.total}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-600 mb-2">Renting</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Rent</span>
                    <span>${result.monthlyComparison.renting.rent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance</span>
                    <span>${result.monthlyComparison.renting.insurance}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-8">
                    <span>Total</span>
                    <span>${result.monthlyComparison.renting.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
