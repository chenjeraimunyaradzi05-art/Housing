'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, Button, Badge, Spinner, PropertyMap, ComparableSalesView } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface PropertyImage {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  order: number;
}

interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface Property {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  propertyType: string;
  listingType: string;
  status: string;
  price: string;
  currency: string;
  rentAmount: string | null;
  rentPeriod: string | null;
  securityDeposit: string | null;
  address: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  lotSizeUnit: string | null;
  yearBuilt: number | null;
  stories: number | null;
  parkingSpaces: number | null;
  garageSpaces: number | null;
  features: string[];
  amenities: string[];
  utilities: string[];
  isInvestment: boolean;
  capRate: number | null;
  noi: string | null;
  occupancyRate: number | null;
  monthlyRent: string | null;
  annualTaxes: string | null;
  annualInsurance: string | null;
  hoaFees: string | null;
  hoaFrequency: string | null;
  pricePerSqFt: string | null;
  viewCount: number;
  favoriteCount: number;
  ownerId: string;
  images: PropertyImage[];
  documents: PropertyDocument[];
  createdAt: string;
  updatedAt: string;
  _count?: { favorites: number };
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

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatPropertyType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  const propertyId = params.id as string;

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ property: Property }>(`/api/properties/${propertyId}`);

      if (response.success && response.data) {
        setProperty(response.data.property);
      } else {
        setError(response.error?.message || 'Failed to load property');
      }
    } catch {
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const checkSavedStatus = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get<{ saved: boolean }>(`/api/properties/${propertyId}/saved`);
      if (response.success && response.data) {
        setIsSaved(response.data.saved);
      }
    } catch {
      // Silently fail
    }
  }, [propertyId, user]);

  useEffect(() => {
    fetchProperty();
    checkSavedStatus();
  }, [fetchProperty, checkSavedStatus]);

  const toggleSave = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSavingProperty(true);
    try {
      if (isSaved) {
        await api.delete(`/api/properties/${propertyId}/save`);
        setIsSaved(false);
      } else {
        await api.post(`/api/properties/${propertyId}/save`);
        setIsSaved(true);
      }
    } catch {
      // Handle error
    } finally {
      setSavingProperty(false);
    }
  };

  const isOwner = user && property && user.id === property.ownerId;
  const placeholderImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop';
  const images = property?.images?.length ? property.images.sort((a, b) => a.order - b.order) : [];
  const primaryImage = images.find((img) => img.isPrimary) || images[0];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <Card variant="bordered" className="p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {error || 'Property Not Found'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || 'The property you&apos;re looking for doesn&apos;t exist or has been removed.'}
        </p>
        <Link href="/dashboard/properties">
          <Button>Back to Properties</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Properties
      </Link>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Main Image */}
        <div
          className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setShowGallery(true)}
        >
          <Image
            src={primaryImage?.url || placeholderImage}
            alt={property.title}
            fill
            className="object-cover"
            priority
          />
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              +{images.length - 1} photos
            </div>
          )}
        </div>

        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {images.slice(1, 5).map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => {
                  setSelectedImageIndex(index + 1);
                  setShowGallery(true);
                }}
              >
                <Image
                  src={image.url}
                  alt={image.caption || `Property image ${index + 2}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">
                      +{images.length - 5}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={property.listingType === 'sale' ? 'primary' : 'secondary'}>
              {property.listingType === 'sale' ? 'For Sale' : property.listingType === 'rent' ? 'For Rent' : 'Lease to Own'}
            </Badge>
            <Badge variant="default">{formatPropertyType(property.propertyType)}</Badge>
            {property.isInvestment && <Badge variant="success">Investment</Badge>}
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {property.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {property.address}
            {property.addressLine2 && `, ${property.addressLine2}`}
            , {property.city}, {property.state} {property.zipCode}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(property.price, property.currency)}
            {property.listingType === 'rent' && (
              <span className="text-lg font-normal text-gray-500">/mo</span>
            )}
          </div>
          {property.pricePerSqFt && (
            <p className="text-sm text-gray-500">
              {formatPrice(property.pricePerSqFt)}/sqft
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={toggleSave}
              disabled={savingProperty}
            >
              {savingProperty ? (
                <Spinner size="sm" />
              ) : (
                <svg
                  className={`w-4 h-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
                  fill={isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            {isOwner && (
              <Link href={`/dashboard/properties/${property.id}/edit`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              </Link>
            )}
            <Button>Contact Agent</Button>
          </div>
        </div>
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Features */}
          <Card variant="bordered" className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Property Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.bedrooms !== null && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.bedrooms}
                  </p>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                </div>
              )}
              {property.bathrooms !== null && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.bathrooms}
                  </p>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                </div>
              )}
              {property.squareFeet !== null && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(property.squareFeet)}
                  </p>
                  <p className="text-sm text-gray-500">Sq. Ft.</p>
                </div>
              )}
              {property.yearBuilt !== null && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {property.yearBuilt}
                  </p>
                  <p className="text-sm text-gray-500">Year Built</p>
                </div>
              )}
            </div>
          </Card>

          {/* Description */}
          {property.description && (
            <Card variant="bordered" className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {property.description}
              </p>
            </Card>
          )}

          {/* Location Map */}
          {property.latitude && property.longitude && (
            <Card variant="bordered" className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Location
              </h2>
              <PropertyMap
                latitude={Number(property.latitude)}
                longitude={Number(property.longitude)}
                address={`${property.address}${property.addressLine2 ? ', ' + property.addressLine2 : ''}, ${property.city}, ${property.state} ${property.zipCode}`}
                title={property.title}
                height="400px"
              />
              {property.neighborhood && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  <span className="font-medium">Neighborhood:</span> {property.neighborhood}
                </p>
              )}
            </Card>
          )}

          {/* Features & Amenities */}
          {(property.features?.length > 0 || property.amenities?.length > 0) && (
            <Card variant="bordered" className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Features & Amenities
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {property.features?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Features</h3>
                    <ul className="space-y-1">
                      {property.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {property.amenities?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Amenities</h3>
                    <ul className="space-y-1">
                      {property.amenities.map((amenity, i) => (
                        <li key={i} className="flex items-center text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Investment Details */}
          {property.isInvestment && (
            <Card variant="bordered" className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Investment Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.capRate !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Cap Rate</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {property.capRate}%
                    </p>
                  </div>
                )}
                {property.noi && (
                  <div>
                    <p className="text-sm text-gray-500">NOI</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(property.noi)}
                    </p>
                  </div>
                )}
                {property.occupancyRate !== null && (
                  <div>
                    <p className="text-sm text-gray-500">Occupancy Rate</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {property.occupancyRate}%
                    </p>
                  </div>
                )}
                {property.monthlyRent && (
                  <div>
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(property.monthlyRent)}
                    </p>
                  </div>
                )}
                {property.annualTaxes && (
                  <div>
                    <p className="text-sm text-gray-500">Annual Taxes</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(property.annualTaxes)}
                    </p>
                  </div>
                )}
                {property.annualInsurance && (
                  <div>
                    <p className="text-sm text-gray-500">Annual Insurance</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(property.annualInsurance)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Specs */}
          <Card variant="bordered" className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Property Specs
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatPropertyType(property.propertyType)}
                </dd>
              </div>
              {property.stories !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Stories</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{property.stories}</dd>
                </div>
              )}
              {property.lotSize !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Lot Size</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(property.lotSize)} {property.lotSizeUnit || 'sqft'}
                  </dd>
                </div>
              )}
              {property.parkingSpaces !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Parking</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {property.parkingSpaces} spaces
                  </dd>
                </div>
              )}
              {property.garageSpaces !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Garage</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {property.garageSpaces} cars
                  </dd>
                </div>
              )}
              {property.hoaFees && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">HOA Fees</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(property.hoaFees)}/{property.hoaFrequency || 'month'}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Stats */}
          <Card variant="bordered" className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Listing Activity
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-500">Views</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(property.viewCount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Saves</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(property._count?.favorites || property.favoriteCount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Listed</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {new Date(property.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Location */}
          {property.neighborhood && (
            <Card variant="bordered" className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Neighborhood
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{property.neighborhood}</p>
            </Card>
          )}

          {/* Documents */}
          {property.documents?.length > 0 && (
            <Card variant="bordered" className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Documents
              </h2>
              <ul className="space-y-2">
                {property.documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Comparable Sales Analysis (for investment properties or when data available) */}
      <ComparableSalesView propertyId={propertyId} isOwner={isOwner} />

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={() => setShowGallery(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
            onClick={() => setSelectedImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative w-full max-w-5xl h-[80vh] mx-4">
            <Image
              src={images[selectedImageIndex]?.url || placeholderImage}
              alt={images[selectedImageIndex]?.caption || 'Property image'}
              fill
              className="object-contain"
            />
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
            onClick={() => setSelectedImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
