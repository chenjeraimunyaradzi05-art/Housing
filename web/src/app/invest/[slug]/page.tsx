'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/lib/api';

interface Pool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  targetAmount: number;
  raisedAmount: number;
  minInvestment: number;
  maxInvestment: number | null;
  sharePrice: number;
  totalShares: number;
  availableShares: number;
  expectedReturn: number | null;
  holdPeriod: number | null;
  distributionFrequency: string;
  status: string;
  riskLevel: string;
  investmentType: string;
  propertyType: string | null;
  location: string | null;
  highlights: string[];
  images: string[];
  fundingProgress: number;
  investorCount: number;
  managementFee: number;
  fundingDeadline: string | null;
  startDate: string | null;
  createdAt: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Investment form state
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [shares, setShares] = useState(1);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [investing, setInvesting] = useState(false);
  const [investError, setInvestError] = useState<string | null>(null);

  // Image gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchPool();
  }, [slug]);

  async function fetchPool() {
    setLoading(true);
    try {
      const response = await api.get<Pool>(`/api/co-invest/pools/${slug}`);
      if (response.success && response.data) {
        setPool(response.data);
      } else {
        setError(response.error?.message || 'Pool not found');
      }
    } catch (err) {
      setError('Failed to load pool details');
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

  async function handleInvest() {
    if (!pool) return;

    setInvesting(true);
    setInvestError(null);

    try {
      const response = await api.post<{
        investorId: string;
        clientSecret: string;
        amount: number;
        shares: number;
      }>(`/api/co-invest/pools/${pool.id}/invest`, {
        shares,
        agreementSigned,
      });

      if (response.success && response.data) {
        // In production, integrate with Stripe Elements here
        // For now, redirect to a success page
        router.push(`/dashboard/investments?success=true&poolId=${pool.id}`);
      } else {
        setInvestError(response.error?.message || 'Investment failed');
      }
    } catch (err) {
      setInvestError('Failed to process investment');
    } finally {
      setInvesting(false);
    }
  }

  const investmentAmount = pool ? shares * pool.sharePrice : 0;
  const isValidInvestment =
    pool &&
    investmentAmount >= pool.minInvestment &&
    (!pool.maxInvestment || investmentAmount <= pool.maxInvestment) &&
    shares <= pool.availableShares;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Pool not found'}
          </h2>
          <Link href="/invest">
            <Button className="mt-4">Browse Opportunities</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isAcceptingInvestments = ['seeking', 'active'].includes(pool.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold text-rose-600">
              VÖR
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/invest"
                className="text-gray-600 hover:text-rose-600 dark:text-gray-300"
              >
                ← All Opportunities
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                {pool.images?.[activeImageIndex] ? (
                  <img
                    src={pool.images[activeImageIndex]}
                    alt={pool.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-gray-400"
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
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant={getRiskBadgeVariant(pool.riskLevel)}>
                    {pool.riskLevel} risk
                  </Badge>
                  <Badge>{pool.investmentType}</Badge>
                </div>
              </div>
              {pool.images && pool.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {pool.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${
                        idx === activeImageIndex
                          ? 'border-rose-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {pool.name}
              </h1>
              {pool.location && (
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
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
            </div>

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                About This Opportunity
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {pool.description || 'No description provided.'}
              </p>
            </Card>

            {/* Highlights */}
            {pool.highlights && pool.highlights.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Investment Highlights
                </h2>
                <ul className="space-y-3">
                  {pool.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Investment Details */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Investment Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Share Price</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(pool.sharePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Shares</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pool.totalShares.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Available Shares</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pool.availableShares.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expected Return</p>
                  <p className="text-lg font-semibold text-green-600">
                    {pool.expectedReturn ? `${pool.expectedReturn}% annually` : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hold Period</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pool.holdPeriod ? `${pool.holdPeriod} months` : 'Flexible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Distributions</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {pool.distributionFrequency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Management Fee</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pool.managementFee}%
                  </p>
                </div>
                {pool.propertyType && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Property Type</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {pool.propertyType}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Investment Card */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(pool.raisedAmount)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      of {formatCurrency(pool.targetAmount)} goal
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-rose-600">
                    {pool.fundingProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pool.fundingProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pool.investorCount}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Investors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pool.availableShares.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Shares Left</p>
                </div>
              </div>

              {/* Investment Limits */}
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Minimum</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(pool.minInvestment)}
                  </span>
                </div>
                {pool.maxInvestment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Maximum</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(pool.maxInvestment)}
                    </span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              {isAcceptingInvestments ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowInvestModal(true)}
                  disabled={pool.availableShares === 0}
                >
                  {pool.availableShares === 0 ? 'Fully Funded' : 'Invest Now'}
                </Button>
              ) : (
                <div className="text-center py-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300 font-medium capitalize">
                    {pool.status === 'funded'
                      ? 'Funding Complete'
                      : pool.status === 'completed'
                      ? 'Investment Completed'
                      : pool.status}
                  </p>
                </div>
              )}

              {/* Deadline */}
              {pool.fundingDeadline && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Funding ends{' '}
                  {new Date(pool.fundingDeadline).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </Card>

            {/* Manager Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pool Manager
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  {pool.manager.avatar ? (
                    <img
                      src={pool.manager.avatar}
                      alt={`${pool.manager.firstName} ${pool.manager.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-rose-600">
                      {pool.manager.firstName[0]}
                      {pool.manager.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pool.manager.firstName} {pool.manager.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pool Manager</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Investment Modal */}
      <Modal
        isOpen={showInvestModal}
        onClose={() => {
          setShowInvestModal(false);
          setInvestError(null);
        }}
        title="Invest in This Pool"
      >
        <div className="space-y-6">
          {investError && (
            <Alert variant="error" onClose={() => setInvestError(null)}>
              {investError}
            </Alert>
          )}

          {/* Share selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Shares
            </label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShares((s) => Math.max(1, s - 1))}
                disabled={shares <= 1}
              >
                -
              </Button>
              <Input
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center w-24"
                min={1}
                max={pool.availableShares}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShares((s) => Math.min(pool.availableShares, s + 1))}
                disabled={shares >= pool.availableShares}
              >
                +
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {pool.availableShares.toLocaleString()} shares available at{' '}
              {formatCurrency(pool.sharePrice)} each
            </p>
          </div>

          {/* Investment summary */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {shares} shares × {formatCurrency(pool.sharePrice)}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(investmentAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-900 dark:text-white">Total Investment</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {formatCurrency(investmentAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Validation messages */}
          {investmentAmount < pool.minInvestment && (
            <p className="text-sm text-red-600">
              Minimum investment is {formatCurrency(pool.minInvestment)}
            </p>
          )}
          {pool.maxInvestment && investmentAmount > pool.maxInvestment && (
            <p className="text-sm text-red-600">
              Maximum investment is {formatCurrency(pool.maxInvestment)}
            </p>
          )}

          {/* Agreement checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="agreement"
              checked={agreementSigned}
              onChange={(e) => setAgreementSigned(e.target.checked)}
            />
            <label htmlFor="agreement" className="text-sm text-gray-700 dark:text-gray-300">
              I have read and agree to the Investment Terms, Privacy Policy, and understand that
              all investments carry risk including potential loss of principal.
            </label>
          </div>

          {/* Submit button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleInvest}
            disabled={!isValidInvestment || !agreementSigned || investing}
          >
            {investing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              `Invest ${formatCurrency(investmentAmount)}`
            )}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your payment will be securely processed by Stripe
          </p>
        </div>
      </Modal>
    </div>
  );
}
