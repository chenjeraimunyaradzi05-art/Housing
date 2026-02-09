'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Button, Input, Select, Badge, Spinner } from '@/components/ui';
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
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  _count?: { favorites: number };
}

interface PropertyFilters {
  search: string;
  propertyType: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minBathrooms: string;
  city: string;
  state: string;
  sortBy: string;
  sortOrder: string;
}

const propertyTypes = [
  { value: '', label: 'All Types' },
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const listingTypes = [
  { value: '', label: 'All Listings' },
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease_to_own', label: 'Lease to Own' },
];

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'squareFeet-desc', label: 'Largest First' },
  { value: 'bedrooms-desc', label: 'Most Bedrooms' },
];

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

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<PropertyFilters>({
    search: searchParams.get('search') || '',
    propertyType: searchParams.get('propertyType') || '',
    listingType: searchParams.get('listingType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minBedrooms: searchParams.get('minBedrooms') || '',
    minBathrooms: searchParams.get('minBathrooms') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '12');

    if (filters.search) params.set('search', filters.search);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.listingType) params.set('listingType', filters.listingType);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minBedrooms) params.set('minBedrooms', filters.minBedrooms);
    if (filters.minBathrooms) params.set('minBathrooms', filters.minBathrooms);
    if (filters.city) params.set('city', filters.city);
    if (filters.state) params.set('state', filters.state);
    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);

    try {
      const response = await api.get<Property[]>(`/api/properties?${params.toString()}`);

      if (response.success && response.data) {
        setProperties(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotal(response.meta?.total || 0);
      } else {
        setError(response.error?.message || 'Failed to load properties');
      }
    } catch {
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (key: keyof PropertyFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      propertyType: '',
      listingType: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      minBathrooms: '',
      city: '',
      state: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(
    (v, i) => v && i < 9 // Exclude sortBy and sortOrder from "active filters" check
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Properties
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse and discover investment properties
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/properties/saved">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Saved
            </Button>
          </Link>
          <Link href="/dashboard/properties/new">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <Card variant="bordered" className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              placeholder="Search properties..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              options={propertyTypes}
              className="w-40"
            />

            <Select
              value={filters.listingType}
              onChange={(e) => handleFilterChange('listingType', e.target.value)}
              options={listingTypes}
              className="w-40"
            />

            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              options={sortOptions}
              className="w-44"
            />

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Price
                </label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Price
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Bedrooms
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.minBedrooms}
                  onChange={(e) => handleFilterChange('minBedrooms', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Bathrooms
                </label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.minBathrooms}
                  onChange={(e) => handleFilterChange('minBathrooms', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <Input
                  placeholder="Any city"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <Input
                  placeholder="Any state"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {properties.length} of {total} properties
        </p>
      )}

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
            Error Loading Properties
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchProperties}>Try Again</Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && properties.length === 0 && (
        <Card variant="bordered" className="p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Properties Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters to find more properties.'
              : 'No properties have been listed yet.'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Properties Grid */}
      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
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

function PropertyCard({ property }: { property: Property }) {
  const primaryImage = property.images?.find((img) => img.isPrimary) || property.images?.[0];
  const placeholderImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop';

  return (
    <Link href={`/dashboard/properties/${property.id}`}>
      <Card variant="bordered" hoverable className="overflow-hidden h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
          <Image
            src={primaryImage?.url || placeholderImage}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={property.listingType === 'sale' ? 'primary' : 'secondary'}>
              {property.listingType === 'sale' ? 'For Sale' : property.listingType === 'rent' ? 'For Rent' : 'Lease to Own'}
            </Badge>
          </div>
          {/* Favorite Count */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {property._count?.favorites || property.favoriteCount || 0}
          </div>
        </div>

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
          <h3 className="mt-1 font-semibold text-gray-900 dark:text-white line-clamp-1">
            {property.title}
          </h3>

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

          {/* Property Type */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {formatPropertyType(property.propertyType)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {property.viewCount} views
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
