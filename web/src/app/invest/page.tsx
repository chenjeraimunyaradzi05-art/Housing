'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';

interface Pool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  targetAmount: number;
  raisedAmount: number;
  minInvestment: number;
  sharePrice: number;
  expectedReturn: number | null;
  holdPeriod: number | null;
  distributionFrequency: string;
  status: string;
  riskLevel: string;
  investmentType: string;
  propertyType: string | null;
  location: string | null;
  images: string[];
  fundingProgress: number;
  investorCount: number;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function InvestPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [investmentType, setInvestmentType] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPools();
  }, [search, riskLevel, investmentType, sortBy, page]);

  async function fetchPools() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (riskLevel) params.set('riskLevel', riskLevel);
      if (investmentType) params.set('investmentType', investmentType);
      params.set('sortBy', sortBy);
      params.set('page', page.toString());
      params.set('limit', '12');

      const response = await api.get<Pool[]>(`/api/co-invest/pools?${params}`);
      if (response.success && response.data) {
        setPools(response.data);
        if (response.meta) {
          setMeta({
            page: response.meta.page ?? 1,
            limit: response.meta.limit ?? 12,
            total: response.meta.total ?? 0,
            totalPages: response.meta.totalPages ?? 1,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getRiskBadgeVariant(risk: string): 'default' | 'success' | 'warning' | 'error' {
    switch (risk) {
      case 'low':
        return 'success';
      case 'moderate':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  }

  function getStatusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
    switch (status) {
      case 'seeking':
        return 'success';
      case 'funded':
        return 'warning';
      case 'active':
      case 'distributing':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold text-rose-600">
              VÖR
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Investment Opportunities
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore co-investment pools and build generational wealth with other women investors
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search pools..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value);
                setPage(1);
              }}
              placeholder="All Risk Levels"
              options={[
                { value: 'low', label: 'Low Risk' },
                { value: 'moderate', label: 'Moderate Risk' },
                { value: 'high', label: 'High Risk' },
              ]}
            />
            <Select
              value={investmentType}
              onChange={(e) => {
                setInvestmentType(e.target.value);
                setPage(1);
              }}
              placeholder="All Types"
              options={[
                { value: 'equity', label: 'Equity' },
                { value: 'debt', label: 'Debt' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'createdAt', label: 'Newest First' },
                { value: 'targetAmount', label: 'Target Amount' },
                { value: 'expectedReturn', label: 'Expected Return' },
                { value: 'raisedAmount', label: 'Amount Raised' },
              ]}
            />
          </div>
        </Card>

        {/* Pools Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : pools.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No investment pools found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or check back later for new opportunities
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <Link key={pool.id} href={`/invest/${pool.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    {/* Image */}
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                      {pool.images?.[0] ? (
                        <img
                          src={pool.images[0]}
                          alt={pool.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Badge variant={getStatusBadgeVariant(pool.status)}>
                          {pool.status}
                        </Badge>
                        <Badge variant={getRiskBadgeVariant(pool.riskLevel)}>
                          {pool.riskLevel} risk
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {pool.name}
                      </h3>

                      {pool.location && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {pool.location}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatCurrency(pool.raisedAmount)} raised
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {pool.fundingProgress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(pool.fundingProgress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          of {formatCurrency(pool.targetAmount)} goal
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Min. Invest</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(pool.minInvestment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Expected</p>
                          <p className="text-sm font-semibold text-green-600">
                            {pool.expectedReturn ? `${pool.expectedReturn}%` : 'TBD'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Investors</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {pool.investorCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-gray-600 dark:text-gray-400 px-4">
                  Page {page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
