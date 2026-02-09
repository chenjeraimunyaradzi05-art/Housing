'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, Button, Input, Select, Spinner, Badge } from '@/components/ui';
import Layout from '@/components/ui/Layout';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// ==================== TYPES ====================

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  propertyType: string;
  listingType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  createdAt: string;
}

interface MapFilters {
  priceMin: string;
  priceMax: string;
  propertyType: string;
  bedrooms: string;
  listingType: string;
}

const PROPERTY_TYPES = [
  'SINGLE_FAMILY',
  'MULTI_FAMILY',
  'CONDO',
  'TOWNHOUSE',
  'APARTMENT',
  'LAND',
  'COMMERCIAL',
];

const LISTING_TYPES = ['FOR_SALE', 'FOR_RENT', 'SOLD', 'OFF_MARKET'];

// ==================== MAIN COMPONENT ====================

export default function PropertyMapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    priceMin: '',
    priceMax: '',
    propertyType: '',
    bedrooms: '',
    listingType: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Default map center (US)
  const [center, setCenter] = useState<[number, number]>([39.8283, -98.5795]);
  const [zoom, setZoom] = useState(4);

  // ==================== FETCH PROPERTIES ====================

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.priceMin) params.append('priceMin', filters.priceMin);
      if (filters.priceMax) params.append('priceMax', filters.priceMax);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.listingType) params.append('listingType', filters.listingType);

      const response = await fetch(`/api/properties?${params}&limit=100`);
      const data = await response.json();

      if (data.success) {
        // Filter properties that have coordinates
        const propertiesWithCoords = data.data.filter(
          (p: Property) => p.latitude && p.longitude
        );
        setProperties(propertiesWithCoords);

        // Center map on first property if available
        if (propertiesWithCoords.length > 0) {
          const first = propertiesWithCoords[0];
          if (first.latitude && first.longitude) {
            setCenter([first.latitude, first.longitude]);
            setZoom(10);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Check if Leaflet CSS is loaded
  useEffect(() => {
    // Add Leaflet CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    link.onload = () => setMapReady(true);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // ==================== PROPERTY CLUSTERING ====================

  // Simple clustering based on proximity
  const clusters = useMemo(() => {
    if (properties.length === 0) return [];

    const CLUSTER_RADIUS = 0.5; // degrees
    const clustered: Array<{
      lat: number;
      lng: number;
      properties: Property[];
    }> = [];

    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      // Find existing cluster
      const existingCluster = clustered.find(
        (c) =>
          Math.abs(c.lat - property.latitude!) < CLUSTER_RADIUS &&
          Math.abs(c.lng - property.longitude!) < CLUSTER_RADIUS
      );

      if (existingCluster) {
        existingCluster.properties.push(property);
        // Recalculate center
        existingCluster.lat =
          existingCluster.properties.reduce((sum, p) => sum + (p.latitude || 0), 0) /
          existingCluster.properties.length;
        existingCluster.lng =
          existingCluster.properties.reduce((sum, p) => sum + (p.longitude || 0), 0) /
          existingCluster.properties.length;
      } else {
        clustered.push({
          lat: property.latitude,
          lng: property.longitude,
          properties: [property],
        });
      }
    });

    return clustered;
  }, [properties]);

  // ==================== HANDLERS ====================

  const handleFilterChange = (key: keyof MapFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      propertyType: '',
      bedrooms: '',
      listingType: '',
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}k`;
  };

  // ==================== RENDER ====================

  return (
    <Layout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Property Map
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {properties.length} properties found
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <Input
                label="Min Price"
                type="number"
                placeholder="$0"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                className="w-32"
              />
              <Input
                label="Max Price"
                type="number"
                placeholder="Any"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                className="w-32"
              />
              <Select
                label="Property Type"
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  ...PROPERTY_TYPES.map((t) => ({
                    value: t,
                    label: t.replace('_', ' '),
                  })),
                ]}
              />
              <Select
                label="Bedrooms"
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                options={[
                  { value: '', label: 'Any' },
                  { value: '1', label: '1+' },
                  { value: '2', label: '2+' },
                  { value: '3', label: '3+' },
                  { value: '4', label: '4+' },
                  { value: '5', label: '5+' },
                ]}
              />
              <Select
                label="Listing Type"
                value={filters.listingType}
                onChange={(e) => handleFilterChange('listingType', e.target.value)}
                options={[
                  { value: '', label: 'All' },
                  ...LISTING_TYPES.map((t) => ({
                    value: t,
                    label: t.replace('_', ' '),
                  })),
                ]}
              />
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </Card>
        )}

        {/* Map Container */}
        <div className="flex-1 flex gap-4">
          {/* Map */}
          <div className="flex-1 relative rounded-lg overflow-hidden border dark:border-gray-700">
            {!mapReady || loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Spinner size="lg" />
              </div>
            ) : (
              <MapContainer
                center={center}
                zoom={zoom}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {clusters.map((cluster, index) => (
                  <Marker
                    key={index}
                    position={[cluster.lat, cluster.lng]}
                    eventHandlers={{
                      click: () => {
                        if (cluster.properties.length === 1) {
                          setSelectedProperty(cluster.properties[0]);
                        }
                      },
                    }}
                  >
                    <Popup>
                      {cluster.properties.length === 1 ? (
                        <PropertyPopup property={cluster.properties[0]} />
                      ) : (
                        <ClusterPopup
                          properties={cluster.properties}
                          onSelect={setSelectedProperty}
                        />
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Property List Sidebar */}
          <div className="w-80 hidden lg:block overflow-y-auto">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Properties</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : properties.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No properties found
                </p>
              ) : (
                <div className="space-y-3">
                  {properties.slice(0, 20).map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      selected={selectedProperty?.id === property.id}
                      onClick={() => {
                        setSelectedProperty(property);
                        if (property.latitude && property.longitude) {
                          setCenter([property.latitude, property.longitude]);
                          setZoom(14);
                        }
                      }}
                    />
                  ))}
                  {properties.length > 20 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      And {properties.length - 20} more...
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ==================== PROPERTY POPUP ====================

function PropertyPopup({ property }: { property: Property }) {
  return (
    <div className="min-w-[200px]">
      <h4 className="font-semibold text-sm mb-1">{property.title}</h4>
      <p className="text-xs text-gray-500 mb-2">{property.address}</p>
      <p className="text-lg font-bold text-purple-600">
        ${property.price.toLocaleString()}
      </p>
      <div className="flex gap-2 mt-2 text-xs text-gray-600">
        {property.bedrooms && <span>{property.bedrooms} beds</span>}
        {property.bathrooms && <span>{property.bathrooms} baths</span>}
        {property.squareFeet && <span>{property.squareFeet.toLocaleString()} sqft</span>}
      </div>
      <a
        href={`/dashboard/properties/${property.id}`}
        className="text-sm text-purple-600 hover:underline mt-2 inline-block"
      >
        View Details →
      </a>
    </div>
  );
}

// ==================== CLUSTER POPUP ====================

interface ClusterPopupProps {
  properties: Property[];
  onSelect: (property: Property) => void;
}

function ClusterPopup({ properties, onSelect }: ClusterPopupProps) {
  return (
    <div className="min-w-[200px] max-h-[300px] overflow-y-auto">
      <h4 className="font-semibold text-sm mb-2">
        {properties.length} Properties
      </h4>
      <div className="space-y-2">
        {properties.slice(0, 5).map((property) => (
          <button
            key={property.id}
            onClick={() => onSelect(property)}
            className="w-full text-left p-2 hover:bg-gray-100 rounded text-xs"
          >
            <p className="font-medium truncate">{property.title}</p>
            <p className="text-purple-600 font-semibold">
              ${property.price.toLocaleString()}
            </p>
          </button>
        ))}
        {properties.length > 5 && (
          <p className="text-xs text-gray-500 text-center">
            +{properties.length - 5} more
          </p>
        )}
      </div>
    </div>
  );
}

// ==================== PROPERTY CARD ====================

interface PropertyCardProps {
  property: Property;
  selected: boolean;
  onClick: () => void;
}

function PropertyCard({ property, selected, onClick }: PropertyCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
      }`}
    >
      <h4 className="font-medium text-sm truncate">{property.title}</h4>
      <p className="text-xs text-gray-500 truncate">{property.address}</p>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold text-purple-600">
          ${property.price.toLocaleString()}
        </span>
        <Badge className="text-xs">
          {property.listingType.replace('_', ' ')}
        </Badge>
      </div>
      <div className="flex gap-2 mt-1 text-xs text-gray-500">
        {property.bedrooms && <span>{property.bedrooms} bd</span>}
        {property.bathrooms && <span>{property.bathrooms} ba</span>}
      </div>
    </button>
  );
}
