'use client';

import { useState, useEffect } from 'react';
import { Card, Spinner, Button } from '@/components/ui';

interface TaxSummary {
  taxYear: number;
  totalIncome: number;
  rentalIncome: number;
  investmentIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  estimatedTax: number;
  effectiveRate: number;
  quarterlyPayments: QuarterlyPayment[];
}

interface QuarterlyPayment {
  quarter: number;
  dueDate: string;
  amount: number;
  status: string;
}

interface Deduction {
  id: string;
  category: string;
  description: string;
  amount: number;
  propertyName?: string;
  isVerified: boolean;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  dueDate: string;
  issueDate: string;
}

const DEDUCTION_CATEGORIES = [
  { key: 'mortgage_interest', label: 'Mortgage Interest', icon: '🏠' },
  { key: 'property_tax', label: 'Property Tax', icon: '📋' },
  { key: 'depreciation', label: 'Depreciation', icon: '📉' },
  { key: 'repairs', label: 'Repairs & Maintenance', icon: '🔧' },
  { key: 'insurance', label: 'Insurance', icon: '🛡️' },
  { key: 'management', label: 'Management Fees', icon: '👩‍💼' },
  { key: 'travel', label: 'Travel', icon: '✈️' },
  { key: 'other', label: 'Other', icon: '📦' },
];

const MOCK_DEDUCTIONS: Deduction[] = [
  { id: '1', category: 'mortgage_interest', description: 'Primary residence mortgage interest', amount: 12500, propertyName: 'Main St Home', isVerified: true },
  { id: '2', category: 'property_tax', description: 'Annual property tax', amount: 4800, propertyName: 'Main St Home', isVerified: true },
  { id: '3', category: 'depreciation', description: 'Rental property depreciation', amount: 8200, propertyName: 'Oak Ave Rental', isVerified: true },
  { id: '4', category: 'repairs', description: 'HVAC system repair', amount: 3200, propertyName: 'Oak Ave Rental', isVerified: false },
  { id: '5', category: 'insurance', description: 'Landlord insurance premium', amount: 1800, propertyName: 'Oak Ave Rental', isVerified: true },
];

const MOCK_INVOICES: InvoiceItem[] = [
  { id: '1', invoiceNumber: 'INV-001', clientName: 'Tenant - Unit A', total: 2400, status: 'paid', dueDate: '2026-01-15', issueDate: '2026-01-01' },
  { id: '2', invoiceNumber: 'INV-002', clientName: 'Tenant - Unit B', total: 1800, status: 'sent', dueDate: '2026-02-01', issueDate: '2026-01-15' },
  { id: '3', invoiceNumber: 'INV-003', clientName: 'Property Management Co.', total: 5000, status: 'draft', dueDate: '2026-02-15', issueDate: '2026-01-28' },
  { id: '4', invoiceNumber: 'INV-004', clientName: 'Tenant - Unit A', total: 2400, status: 'overdue', dueDate: '2025-12-15', issueDate: '2025-12-01' },
];

export default function TaxDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'deductions' | 'invoices' | 'estimates' | 'reports'>('overview');
  const [taxYear, setTaxYear] = useState(2026);
  const [loading, setLoading] = useState(false);
  const [deductions, setDeductions] = useState<Deduction[]>(MOCK_DEDUCTIONS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(MOCK_INVOICES);
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);

  // New deduction form
  const [newDeduction, setNewDeduction] = useState({ category: 'mortgage_interest', description: '', amount: '' });

  // New invoice form
  const [newInvoice, setNewInvoice] = useState({ clientName: '', total: '', dueDate: '', notes: '' });

  // Tax estimation form
  const [estForm, setEstForm] = useState({
    totalIncome: '85000', rentalIncome: '24000', investmentIncome: '5000',
    filingStatus: 'single', state: 'CA',
  });
  const [estResult, setEstResult] = useState<TaxSummary | null>(null);

  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  async function calculateEstimate() {
    setLoading(true);
    try {
      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { filingStatus: estForm.filingStatus, state: estForm.state },
          income: {
            totalIncome: +estForm.totalIncome,
            rentalIncome: +estForm.rentalIncome,
            investmentIncome: +estForm.investmentIncome,
          },
        }),
      });
      const data = await res.json();
      setEstResult(data);
    } catch (error) {
      console.error('Tax calculation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'deductions', label: 'Deductions', icon: '📝' },
    { key: 'invoices', label: 'Invoices', icon: '📄' },
    { key: 'estimates', label: 'Tax Estimates', icon: '🧮' },
    { key: 'reports', label: 'Reports', icon: '📋' },
  ] as const;

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-purple-100 text-purple-800',
    draft: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tax & Accounting</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage deductions, invoices, and tax planning
          </p>
        </div>
        <select
          value={taxYear}
          onChange={(e) => setTaxYear(+e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value={2026}>Tax Year 2026</option>
          <option value={2025}>Tax Year 2025</option>
          <option value={2024}>Tax Year 2024</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <p className="text-sm text-gray-500 mb-1">Total Deductions</p>
              <p className="text-3xl font-bold text-green-600">${totalDeductions.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{deductions.length} items tracked</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500 mb-1">Invoice Revenue</p>
              <p className="text-3xl font-bold text-blue-600">
                ${paidInvoices.reduce((s, i) => s + i.total, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">{paidInvoices.length} paid / {invoices.length} total</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500 mb-1">Outstanding</p>
              <p className="text-3xl font-bold text-yellow-600">
                ${invoices.filter(i => ['sent', 'viewed'].includes(i.status)).reduce((s, i) => s + i.total, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">Pending payment</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500 mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-600">
                ${overdueInvoices.reduce((s, i) => s + i.total, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">{overdueInvoices.length} overdue invoices</p>
            </Card>
          </div>

          {/* Deduction Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Deduction Breakdown by Category</h3>
            <div className="space-y-3">
              {DEDUCTION_CATEGORIES.map((cat) => {
                const catTotal = deductions.filter(d => d.category === cat.key).reduce((s, d) => s + d.amount, 0);
                const percent = totalDeductions > 0 ? (catTotal / totalDeductions) * 100 : 0;
                if (catTotal === 0) return null;
                return (
                  <div key={cat.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{cat.icon} {cat.label}</span>
                      <span className="font-medium">${catTotal.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quarterly Payment Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quarterly Payment Deadlines</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { q: 'Q1', date: `Apr 15, ${taxYear}`, status: 'upcoming' },
                { q: 'Q2', date: `Jun 15, ${taxYear}`, status: 'upcoming' },
                { q: 'Q3', date: `Sep 15, ${taxYear}`, status: 'upcoming' },
                { q: 'Q4', date: `Jan 15, ${taxYear + 1}`, status: 'upcoming' },
              ].map((payment) => (
                <div key={payment.q} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{payment.q}</p>
                  <p className="text-sm text-gray-500">{payment.date}</p>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mt-2 inline-block">
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Deductions Tab */}
      {activeTab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Deductions</h2>
            <Button onClick={() => setShowAddDeduction(!showAddDeduction)}>
              {showAddDeduction ? 'Cancel' : '+ Add Deduction'}
            </Button>
          </div>

          {showAddDeduction && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">New Deduction</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={newDeduction.category}
                  onChange={(e) => setNewDeduction(p => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                  {DEDUCTION_CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <input type="text" placeholder="Description" value={newDeduction.description}
                  onChange={(e) => setNewDeduction(p => ({ ...p, description: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                <input type="number" placeholder="Amount ($)" value={newDeduction.amount}
                  onChange={(e) => setNewDeduction(p => ({ ...p, amount: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <Button className="mt-4" onClick={() => {
                if (newDeduction.description && newDeduction.amount) {
                  setDeductions(prev => [...prev, {
                    id: String(Date.now()), category: newDeduction.category,
                    description: newDeduction.description, amount: +newDeduction.amount,
                    isVerified: false,
                  }]);
                  setNewDeduction({ category: 'mortgage_interest', description: '', amount: '' });
                  setShowAddDeduction(false);
                }
              }}>Save Deduction</Button>
            </Card>
          )}

          <div className="grid gap-3">
            {deductions.map((d) => {
              const cat = DEDUCTION_CATEGORIES.find(c => c.key === d.category);
              return (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat?.icon || '📦'}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{d.description}</p>
                        <p className="text-xs text-gray-500">
                          {cat?.label || d.category}
                          {d.propertyName && ` • ${d.propertyName}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${d.amount.toLocaleString()}</p>
                      {d.isVerified && <span className="text-xs text-green-600">✓ Verified</span>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Total Deductions</span>
              <span className="text-2xl font-bold text-green-600">${totalDeductions.toLocaleString()}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoices</h2>
            <Button onClick={() => setShowAddInvoice(!showAddInvoice)}>
              {showAddInvoice ? 'Cancel' : '+ Create Invoice'}
            </Button>
          </div>

          {showAddInvoice && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">New Invoice</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Client Name" value={newInvoice.clientName}
                  onChange={(e) => setNewInvoice(p => ({ ...p, clientName: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                <input type="number" placeholder="Total Amount ($)" value={newInvoice.total}
                  onChange={(e) => setNewInvoice(p => ({ ...p, total: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                <input type="date" placeholder="Due Date" value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice(p => ({ ...p, dueDate: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                <input type="text" placeholder="Notes (optional)" value={newInvoice.notes}
                  onChange={(e) => setNewInvoice(p => ({ ...p, notes: e.target.value }))}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <Button className="mt-4" onClick={() => {
                if (newInvoice.clientName && newInvoice.total) {
                  setInvoices(prev => [...prev, {
                    id: String(Date.now()),
                    invoiceNumber: `INV-${String(prev.length + 1).padStart(3, '0')}`,
                    clientName: newInvoice.clientName, total: +newInvoice.total,
                    status: 'draft', dueDate: newInvoice.dueDate || new Date().toISOString().slice(0, 10),
                    issueDate: new Date().toISOString().slice(0, 10),
                  }]);
                  setNewInvoice({ clientName: '', total: '', dueDate: '', notes: '' });
                  setShowAddInvoice(false);
                }
              }}>Create Invoice</Button>
            </Card>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-500 uppercase border-b dark:border-gray-700">
                <tr>
                  <th className="pb-3 pr-4">Invoice #</th>
                  <th className="pb-3 pr-4">Client</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Due Date</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b dark:border-gray-800">
                    <td className="py-3 pr-4 font-medium">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4">{inv.clientName}</td>
                    <td className="py-3 pr-4 font-medium">${inv.total.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColors[inv.status] || ''}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{inv.dueDate}</td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax Estimates Tab */}
      {activeTab === 'estimates' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Estimation Calculator</h2>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Income Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</label>
                <input type="number" value={estForm.totalIncome}
                  onChange={(e) => setEstForm(p => ({ ...p, totalIncome: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Rental Income</label>
                <input type="number" value={estForm.rentalIncome}
                  onChange={(e) => setEstForm(p => ({ ...p, rentalIncome: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Investment Income</label>
                <input type="number" value={estForm.investmentIncome}
                  onChange={(e) => setEstForm(p => ({ ...p, investmentIncome: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Filing Status</label>
                <select value={estForm.filingStatus}
                  onChange={(e) => setEstForm(p => ({ ...p, filingStatus: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                  <option value="single">Single</option>
                  <option value="married_joint">Married Filing Jointly</option>
                  <option value="married_separate">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">State</label>
                <input type="text" value={estForm.state}
                  onChange={(e) => setEstForm(p => ({ ...p, state: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
            </div>
            <Button className="mt-4" onClick={calculateEstimate} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Tax Estimate'}
            </Button>
          </Card>

          {estResult && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Estimation Result</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Taxable Income</p>
                  <p className="text-xl font-bold">${(estResult.taxableIncome || 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Estimated Tax</p>
                  <p className="text-xl font-bold text-red-600">${(estResult.estimatedTax || 0).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Effective Rate</p>
                  <p className="text-xl font-bold">{(estResult.effectiveRate || 0).toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Quarterly Payment</p>
                  <p className="text-xl font-bold">${((estResult.estimatedTax || 0) / 4).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Reports & Documents</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Annual Tax Summary', desc: 'Complete summary of income, deductions, and estimated taxes', icon: '📊', action: 'Generate' },
              { title: 'K-1 Statements', desc: 'Partnership income allocation from co-investment pools', icon: '📋', action: 'Generate' },
              { title: 'Deduction Report', desc: 'Detailed breakdown of all tracked deductions by category', icon: '📝', action: 'Download' },
              { title: 'Quarterly Estimates', desc: 'Estimated quarterly tax payments and deadlines', icon: '🧮', action: 'Generate' },
              { title: 'Investment Income Report', desc: 'Capital gains, dividends, and distribution income summary', icon: '💰', action: 'Generate' },
              { title: 'Property P&L', desc: 'Profit and loss statement for each investment property', icon: '🏠', action: 'Generate' },
            ].map((report, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{report.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{report.desc}</p>
                    <Button variant="outline" size="sm">{report.action}</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
