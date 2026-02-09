'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner, Badge } from '@/components/ui';
import api from '@/lib/api';

interface Comparable {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  salePrice: number;
  adjustedPrice: number;
  pricePerSqFt: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  saleDate: string;
  daysOnMarket: number;
  relevanceScore: number;
  distanceFromSubject: number;
  source: string;
}

interface ComparableSalesProps {
  propertyId: string;
  isOwner: boolean;
}

export function ComparableSalesView({ propertyId, isOwner }: ComparableSalesProps) {
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchComparables();
    fetchAnalysis();
  }, [propertyId]);

  const fetchComparables = async () => {
    try {
      const response = await api.get<{
        data: Comparable[];
      }>(`/api/properties/${propertyId}/comparables`);

      if (response.success && response.data) {
        setComparables(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comparables', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await api.get<{ analysis: any }>(
        `/api/properties/${propertyId}/comparables/analysis/summary`
      );

      if (response.success && response.data) {
        setAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error('Failed to fetch analysis', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Valuation Summary */}
      {analysis && (
        <Card variant="bordered" className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 border-primary-200 dark:border-primary-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Valuation Analysis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Suggested Valuation</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">
                {formatPrice(analysis.suggestedValuation)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avg Price/Sqft</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${analysis.avgPricePerSqFt}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Value Range</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatPrice(analysis.valueRange.min)} - {formatPrice(analysis.valueRange.max)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Top Comps</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analysis.topComps}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Comparables List */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comparable Sales ({comparables.length})
        </h2>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Comparable'}
          </Button>
        )}
      </div>

      {/* Add Form Placeholder */}
      {showForm && isOwner && (
        <Card variant="bordered" className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            📝 Comparable sales form would be displayed here. This would allow owners to manually add comparable sales data for valuation analysis.
          </p>
        </Card>
      )}

      {comparables.length === 0 ? (
        <Card variant="bordered" className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No comparable sales data available yet.
            {isOwner && ' Add comparable sales to get a valuation analysis.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comparables.map((comp) => (
            <Card key={comp.id} variant="bordered" className="p-6 hover:shadow-lg transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left side - Address & Details */}
                <div>
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {comp.address}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {comp.city}, {comp.state} {comp.zipCode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    {comp.bedrooms && (
                      <div>
                        <span className="text-gray-500">Beds:</span>
                        <span className="font-medium ml-1">{comp.bedrooms}</span>
                      </div>
                    )}
                    {comp.bathrooms && (
                      <div>
                        <span className="text-gray-500">Baths:</span>
                        <span className="font-medium ml-1">{comp.bathrooms}</span>
                      </div>
                    )}
                    {comp.squareFeet && (
                      <div>
                        <span className="text-gray-500">Sqft:</span>
                        <span className="font-medium ml-1">{comp.squareFeet.toLocaleString()}</span>
                      </div>
                    )}
                    {comp.daysOnMarket && (
                      <div>
                        <span className="text-gray-500">DOM:</span>
                        <span className="font-medium ml-1">{comp.daysOnMarket}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {comp.relevanceScore && (
                      <Badge variant={getRelevanceColor(comp.relevanceScore)}>
                        {comp.relevanceScore}% relevant
                      </Badge>
                    )}
                    <Badge variant="secondary">{comp.source}</Badge>
                  </div>
                </div>

                {/* Right side - Pricing */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Sale Price</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(comp.salePrice)}
                      </p>
                    </div>

                    {comp.adjustedPrice && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Adjusted Price</p>
                        <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                          {formatPrice(comp.adjustedPrice)}
                        </p>
                      </div>
                    )}

                    {comp.pricePerSqFt && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Price/Sqft</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${comp.pricePerSqFt.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p>Sold: {formatDate(comp.saleDate)}</p>
                    {comp.distanceFromSubject && (
                      <p>{comp.distanceFromSubject.toFixed(1)} miles away</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
