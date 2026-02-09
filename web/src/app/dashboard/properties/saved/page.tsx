'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Property {
  id: string;
  title: string;
  slug: string;
  propertyType: string;
  listingType: string;
  status: string;
  price: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  images: PropertyImage[];
}

interface SavedProperty {
  id: string;
  propertyId: string;
  notes: string | null;
  savedAt: string;
  property: Property;
}

const formatPrice = (price: string | number, currency = 'USD') => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPropertyType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function SavedPropertiesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchSavedProperties = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<SavedProperty[]>(
        `/api/properties/saved/list?page=${page}&limit=12`
      );

      if (response.success && response.data) {
        setSavedProperties(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotal(response.meta?.total || 0);
      } else {
        setError(response.error?.message || 'Failed to load saved properties');
      }
    } catch {
      setError('Failed to load saved properties');
    } finally {
      setLoading(false);
    }
  }, [page, user]);

  useEffect(() => {
    if (user) {
      fetchSavedProperties();
    }
  }, [fetchSavedProperties, user]);

  const removeSavedProperty = async (propertyId: string) => {
    setRemovingId(propertyId);
    try {
      const response = await api.delete(`/api/properties/${propertyId}/save`);
      if (response.success) {
        setSavedProperties((prev) =>
          prev.filter((sp) => sp.propertyId !== propertyId)
        );
        setTotal((prev) => prev - 1);
      }
    } catch {
      // Handle error silently
    } finally {
      setRemovingId(null);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Saved Properties
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Properties you&apos;ve saved for later
          </p>
        </div>
        <Link href="/dashboard/properties">
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Properties
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card variant="bordered" className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Saved Properties
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchSavedProperties}>Try Again</Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && savedProperties.length === 0 && (
        <Card variant="bordered" className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Saved Properties
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You haven&apos;t saved any properties yet. Browse listings and click the heart icon to save properties you&apos;re interested in.
          </p>
          <Link href="/dashboard/properties">
            <Button>Browse Properties</Button>
          </Link>
        </Card>
      )}

      {/* Results Count */}
      {!loading && savedProperties.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {total} saved {total === 1 ? 'property' : 'properties'}
        </p>
      )}

      {/* Saved Properties Grid */}
      {!loading && !error && savedProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProperties.map((saved) => (
            <SavedPropertyCard
              key={saved.id}
              savedProperty={saved}
              onRemove={removeSavedProperty}
              isRemoving={removingId === saved.propertyId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface SavedPropertyCardProps {
  savedProperty: SavedProperty;
  onRemove: (propertyId: string) => void;
  isRemoving: boolean;
}

function SavedPropertyCard({ savedProperty, onRemove, isRemoving }: SavedPropertyCardProps) {
  const { property } = savedProperty;
  const primaryImage = property.images?.find((img) => img.isPrimary) || property.images?.[0];
  const placeholderImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop';

  return (
    <Card variant="bordered" className="overflow-hidden h-full group">
      {/* Image */}
      <Link href={`/dashboard/properties/${property.id}`}>
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
          <Image
            src={primaryImage?.url || placeholderImage}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={property.listingType === 'sale' ? 'primary' : 'secondary'}>
              {property.listingType === 'sale' ? 'For Sale' : property.listingType === 'rent' ? 'For Rent' : 'Lease to Own'}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
          {formatPrice(property.price, property.currency)}
          {property.listingType === 'rent' && (
            <span className="text-sm font-normal text-gray-500">/mo</span>
          )}
        </div>

        {/* Title */}
        <Link href={`/dashboard/properties/${property.id}`}>
          <h3 className="mt-1 font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400">
            {property.title}
          </h3>
        </Link>

        {/* Address */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
          {property.address}, {property.city}, {property.state} {property.zipCode}
        </p>

        {/* Features */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.bedrooms} bd
            </span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {property.bathrooms} ba
            </span>
          )}
          {property.squareFeet !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {property.squareFeet.toLocaleString()} sqft
            </span>
          )}
        </div>

        {/* Saved date and actions */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Saved {new Date(savedProperty.savedAt).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            <Link href={`/dashboard/properties/${property.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(property.id)}
              disabled={isRemoving}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isRemoving ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Notes */}
        {savedProperty.notes && (
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Notes:</span> {savedProperty.notes}
          </div>
        )}
      </div>
    </Card>
  );
}
