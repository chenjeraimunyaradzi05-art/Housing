'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Spinner, Button } from '@/components/ui';

interface ValuationResult {
  estimatedValue: number;
  confidenceScore: number;
  priceRange: { low: number; high: number };
  comparables: number;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  actionable: boolean;
}

interface MarketRegion {
  region: string;
  medianPrice: number;
  priceChange: number;
  inventory: number;
  daysOnMarket: number;
  healthScore: number;
}

interface Recommendation {
  id: string;
  title: string;
  type: string;
  matchScore: number;
  expectedReturn: number;
  riskLevel: string;
  location: string;
}

export default function AIDashboardPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [markets, setMarkets] = useState<MarketRegion[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'market' | 'recommendations' | 'valuation'>('insights');

  // Valuation form
  const [valForm, setValForm] = useState({ beds: 3, baths: 2, sqft: 1500, zipcode: '90210', yearBuilt: 2000, propertyType: 'single_family' });
  const [valResult, setValResult] = useState<ValuationResult | null>(null);
  const [valLoading, setValLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [insightsRes, marketsRes, recsRes] = await Promise.all([
        fetch('/api/ai/insights/priority').then(r => r.json()).catch(() => ({ insights: [] })),
        fetch('/api/ai/market').then(r => r.json()).catch(() => ({ regions: [] })),
        fetch('/api/ai/recommendations?limit=5').then(r => r.json()).catch(() => ({ recommendations: [] })),
      ]);
      setInsights(insightsRes.insights || []);
      setMarkets(insightsRes.regions || marketsRes.regions || []);
      setRecommendations(recsRes.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runValuation() {
    setValLoading(true);
    try {
      const res = await fetch('/api/ai/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valForm),
      });
      const data = await res.json();
      setValResult(data);
    } catch (error) {
      console.error('Valuation failed:', error);
    } finally {
      setValLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { key: 'insights', label: 'Financial Insights', icon: '💡' },
    { key: 'market', label: 'Market Analysis', icon: '📊' },
    { key: 'recommendations', label: 'Recommendations', icon: '🎯' },
    { key: 'valuation', label: 'Property Valuation', icon: '🏠' },
  ] as const;

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const riskColors: Record<string, string> = {
    low: 'text-green-600',
    moderate: 'text-yellow-600',
    high: 'text-red-600',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Intelligent insights, valuations, and recommendations powered by AI
        </p>
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

      {/* Financial Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Priority Insights</h2>
            <Button variant="outline" size="sm" onClick={fetchData}>Refresh</Button>
          </div>
          {insights.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">💡</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No insights yet</h3>
              <p className="text-gray-500">AI insights will appear as you add financial data and transactions.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {insights.map((insight, i) => (
                <Card key={insight.id || i} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[insight.priority] || priorityColors.low}`}>
                          {insight.priority}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">{insight.type}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
                    </div>
                    {insight.actionable && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                        Actionable
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Market Analysis Tab */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Market Overview</h2>
          {markets.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">📊</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Market data loading</h3>
              <p className="text-gray-500">Regional market analysis will appear here.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {markets.map((market, i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{market.region}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Median Price</span>
                      <span className="font-medium">${(market.medianPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price Change</span>
                      <span className={`font-medium ${(market.priceChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(market.priceChange || 0) >= 0 ? '+' : ''}{market.priceChange}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Days on Market</span>
                      <span className="font-medium">{market.daysOnMarket || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Health Score</span>
                      <span className="font-medium">{market.healthScore || '-'}/100</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Investment Recommendations</h2>
          {recommendations.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">🎯</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
              <p className="text-gray-500">Complete your profile and investment preferences to get personalized recommendations.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recommendations.map((rec, i) => (
                <Card key={rec.id || i} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{rec.location} • {rec.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-rose-600">{rec.matchScore}%</div>
                      <p className="text-xs text-gray-500">Match</p>
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Expected Return</span>
                      <span className="ml-2 font-medium text-green-600">{rec.expectedReturn}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Risk</span>
                      <span className={`ml-2 font-medium ${riskColors[rec.riskLevel] || ''}`}>{rec.riskLevel}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Property Valuation Tab */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Property Valuation</h2>
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Enter Property Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={valForm.beds}
                  onChange={(e) => setValForm(p => ({ ...p, beds: +e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={valForm.baths}
                  onChange={(e) => setValForm(p => ({ ...p, baths: +e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Square Feet</label>
                <input
                  type="number"
                  value={valForm.sqft}
                  onChange={(e) => setValForm(p => ({ ...p, sqft: +e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Zip Code</label>
                <input
                  type="text"
                  value={valForm.zipcode}
                  onChange={(e) => setValForm(p => ({ ...p, zipcode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Year Built</label>
                <input
                  type="number"
                  value={valForm.yearBuilt}
                  onChange={(e) => setValForm(p => ({ ...p, yearBuilt: +e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Property Type</label>
                <select
                  value={valForm.propertyType}
                  onChange={(e) => setValForm(p => ({ ...p, propertyType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_family">Multi Family</option>
                </select>
              </div>
            </div>
            <Button className="mt-6" onClick={runValuation} disabled={valLoading}>
              {valLoading ? 'Analyzing...' : 'Get AI Valuation'}
            </Button>
          </Card>

          {valResult && (
            <Card className="p-6 bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-900/20 dark:to-purple-900/20">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Valuation Result</h3>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Estimated Value</p>
                <p className="text-4xl font-bold text-rose-600">
                  ${(valResult.estimatedValue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Confidence: {((valResult.confidenceScore || 0) * 100).toFixed(0)}%
                </p>
              </div>
              {valResult.priceRange && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Low Estimate</p>
                    <p className="text-xl font-semibold">${(valResult.priceRange.low || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">High Estimate</p>
                    <p className="text-xl font-semibold">${(valResult.priceRange.high || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
