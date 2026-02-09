'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select, Textarea, Checkbox, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface PropertyFormData {
  // Basic Info
  title: string;
  description: string;
  propertyType: string;
  listingType: string;

  // Pricing
  price: string;
  currency: string;
  rentAmount: string;
  rentPeriod: string;
  securityDeposit: string;

  // Location
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  neighborhood: string;

  // Property Specs
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  lotSize: string;
  lotSizeUnit: string;
  yearBuilt: string;
  stories: string;
  parkingSpaces: string;
  garageSpaces: string;

  // Features
  features: string[];
  amenities: string[];

  // Investment
  isInvestment: boolean;
  capRate: string;
  noi: string;
  occupancyRate: string;
  monthlyRent: string;
  annualTaxes: string;
  annualInsurance: string;
  hoaFees: string;
  hoaFrequency: string;
}

const initialFormData: PropertyFormData = {
  title: '',
  description: '',
  propertyType: 'single_family',
  listingType: 'sale',
  price: '',
  currency: 'USD',
  rentAmount: '',
  rentPeriod: 'monthly',
  securityDeposit: '',
  address: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  neighborhood: '',
  bedrooms: '',
  bathrooms: '',
  squareFeet: '',
  lotSize: '',
  lotSizeUnit: 'sqft',
  yearBuilt: '',
  stories: '',
  parkingSpaces: '',
  garageSpaces: '',
  features: [],
  amenities: [],
  isInvestment: false,
  capRate: '',
  noi: '',
  occupancyRate: '',
  monthlyRent: '',
  annualTaxes: '',
  annualInsurance: '',
  hoaFees: '',
  hoaFrequency: 'monthly',
};

const propertyTypes = [
  { value: 'single_family', label: 'Single Family Home' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'condo', label: 'Condominium' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land / Lot' },
  { value: 'commercial', label: 'Commercial' },
];

const listingTypes = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease_to_own', label: 'Lease to Own' },
];

const commonFeatures = [
  'Central Air',
  'Central Heat',
  'Fireplace',
  'Hardwood Floors',
  'Updated Kitchen',
  'Granite Countertops',
  'Stainless Steel Appliances',
  'Walk-in Closets',
  'Laundry Room',
  'Basement',
  'Attic',
  'High Ceilings',
  'Open Floor Plan',
  'Smart Home',
];

const commonAmenities = [
  'Pool',
  'Hot Tub',
  'Gym / Fitness Center',
  'Clubhouse',
  'Tennis Court',
  'Basketball Court',
  'Playground',
  'Dog Park',
  'Gated Community',
  'Security System',
  'Doorman',
  'Concierge',
  'Parking Garage',
  'Storage Unit',
];

const steps = [
  { id: 1, title: 'Basic Info', description: 'Property type and listing details' },
  { id: 2, title: 'Location', description: 'Address and neighborhood' },
  { id: 3, title: 'Details', description: 'Specs and features' },
  { id: 4, title: 'Pricing', description: 'Price and investment info' },
  { id: 5, title: 'Review', description: 'Review and submit' },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!user) {
    router.push('/login');
    return null;
  }

  const updateField = <K extends keyof PropertyFormData>(
    field: K,
    value: PropertyFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleArrayItem = (field: 'features' | 'amenities', item: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
      if (!formData.listingType) newErrors.listingType = 'Listing type is required';
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    }

    if (step === 4) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'Valid price is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build the request body
      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || undefined,
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        price: parseFloat(formData.price),
        currency: formData.currency,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        features: formData.features,
        amenities: formData.amenities,
        isInvestment: formData.isInvestment,
      };

      // Optional fields
      if (formData.addressLine2) body.addressLine2 = formData.addressLine2;
      if (formData.neighborhood) body.neighborhood = formData.neighborhood;
      if (formData.bedrooms) body.bedrooms = parseInt(formData.bedrooms);
      if (formData.bathrooms) body.bathrooms = parseFloat(formData.bathrooms);
      if (formData.squareFeet) body.squareFeet = parseInt(formData.squareFeet);
      if (formData.lotSize) {
        body.lotSize = parseFloat(formData.lotSize);
        body.lotSizeUnit = formData.lotSizeUnit;
      }
      if (formData.yearBuilt) body.yearBuilt = parseInt(formData.yearBuilt);
      if (formData.stories) body.stories = parseInt(formData.stories);
      if (formData.parkingSpaces) body.parkingSpaces = parseInt(formData.parkingSpaces);
      if (formData.garageSpaces) body.garageSpaces = parseInt(formData.garageSpaces);

      // Rental fields
      if (formData.listingType === 'rent') {
        if (formData.rentAmount) body.rentAmount = parseFloat(formData.rentAmount);
        body.rentPeriod = formData.rentPeriod;
        if (formData.securityDeposit) body.securityDeposit = parseFloat(formData.securityDeposit);
      }

      // Investment fields
      if (formData.isInvestment) {
        if (formData.capRate) body.capRate = parseFloat(formData.capRate);
        if (formData.noi) body.noi = parseFloat(formData.noi);
        if (formData.occupancyRate) body.occupancyRate = parseFloat(formData.occupancyRate);
        if (formData.monthlyRent) body.monthlyRent = parseFloat(formData.monthlyRent);
        if (formData.annualTaxes) body.annualTaxes = parseFloat(formData.annualTaxes);
        if (formData.annualInsurance) body.annualInsurance = parseFloat(formData.annualInsurance);
      }

      // HOA
      if (formData.hoaFees) {
        body.hoaFees = parseFloat(formData.hoaFees);
        body.hoaFrequency = formData.hoaFrequency;
      }

      const response = await api.post<{ property: { id: string } }>('/api/properties', body);

      if (response.success && response.data?.property?.id) {
        router.push(`/dashboard/properties/${response.data.property.id}`);
      } else {
        setSubmitError(response.error?.message || 'Failed to create property');
      }
    } catch {
      setSubmitError('Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Property
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          List your property for sale or rent on VÖR
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2
                ${
                  currentStep > step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : currentStep === step.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-gray-300 text-gray-400'
                }
              `}
            >
              {currentStep > step.id ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <div className="hidden sm:block ml-3">
              <p
                className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 sm:w-24 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card variant="bordered" className="p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Property Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Beautiful 3BR Home in Downtown"
                    error={errors.title}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe your property..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Property Type *
                    </label>
                    <Select
                      value={formData.propertyType}
                      onChange={(e) => updateField('propertyType', e.target.value)}
                      options={propertyTypes}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Listing Type *
                    </label>
                    <Select
                      value={formData.listingType}
                      onChange={(e) => updateField('listingType', e.target.value)}
                      options={listingTypes}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Property Location
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address *
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Main Street"
                    error={errors.address}
                  />
                  {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 2
                  </label>
                  <Input
                    value={formData.addressLine2}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                    placeholder="Apt, Suite, Unit, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City *
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="City"
                      error={errors.city}
                    />
                    {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State *
                    </label>
                    <Input
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="State"
                      error={errors.state}
                    />
                    {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code *
                    </label>
                    <Input
                      value={formData.zipCode}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      placeholder="12345"
                      error={errors.zipCode}
                    />
                    {errors.zipCode && <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Neighborhood
                  </label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => updateField('neighborhood', e.target.value)}
                    placeholder="e.g., West Village, SoHo"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Property Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bedrooms
                    </label>
                    <Input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => updateField('bedrooms', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bathrooms
                    </label>
                    <Input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => updateField('bathrooms', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Square Feet
                    </label>
                    <Input
                      type="number"
                      value={formData.squareFeet}
                      onChange={(e) => updateField('squareFeet', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Year Built
                    </label>
                    <Input
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => updateField('yearBuilt', e.target.value)}
                      placeholder="2000"
                      min="1800"
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stories
                    </label>
                    <Input
                      type="number"
                      value={formData.stories}
                      onChange={(e) => updateField('stories', e.target.value)}
                      placeholder="1"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Parking Spaces
                    </label>
                    <Input
                      type="number"
                      value={formData.parkingSpaces}
                      onChange={(e) => updateField('parkingSpaces', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Garage Spaces
                    </label>
                    <Input
                      type="number"
                      value={formData.garageSpaces}
                      onChange={(e) => updateField('garageSpaces', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lot Size
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.lotSize}
                        onChange={(e) => updateField('lotSize', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="flex-1"
                      />
                      <Select
                        value={formData.lotSizeUnit}
                        onChange={(e) => updateField('lotSizeUnit', e.target.value)}
                        options={[{ value: 'sqft', label: 'sqft' }, { value: 'acres', label: 'acres' }]}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonFeatures.map((feature) => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={formData.features.includes(feature)}
                          onChange={() => toggleArrayItem('features', feature)}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => toggleArrayItem('amenities', amenity)}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pricing & Investment Info
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {formData.listingType === 'rent' ? 'Monthly Rent' : 'Listing Price'} *
                    </label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="0"
                      min="0"
                      error={errors.price}
                    />
                    {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      HOA Fees
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.hoaFees}
                        onChange={(e) => updateField('hoaFees', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="flex-1"
                      />
                      <Select
                        value={formData.hoaFrequency}
                        onChange={(e) => updateField('hoaFrequency', e.target.value)}
                        options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]}
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>

                {formData.listingType === 'rent' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Security Deposit
                      </label>
                      <Input
                        type="number"
                        value={formData.securityDeposit}
                        onChange={(e) => updateField('securityDeposit', e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Investment Toggle */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={formData.isInvestment}
                      onChange={(e) => updateField('isInvestment', e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      This is an investment property
                    </span>
                  </label>
                </div>

                {/* Investment Fields */}
                {formData.isInvestment && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white">Investment Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cap Rate (%)
                        </label>
                        <Input
                          type="number"
                          value={formData.capRate}
                          onChange={(e) => updateField('capRate', e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          NOI (Annual)
                        </label>
                        <Input
                          type="number"
                          value={formData.noi}
                          onChange={(e) => updateField('noi', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Occupancy Rate (%)
                        </label>
                        <Input
                          type="number"
                          value={formData.occupancyRate}
                          onChange={(e) => updateField('occupancyRate', e.target.value)}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Monthly Rental Income
                        </label>
                        <Input
                          type="number"
                          value={formData.monthlyRent}
                          onChange={(e) => updateField('monthlyRent', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Annual Taxes
                        </label>
                        <Input
                          type="number"
                          value={formData.annualTaxes}
                          onChange={(e) => updateField('annualTaxes', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Annual Insurance
                        </label>
                        <Input
                          type="number"
                          value={formData.annualInsurance}
                          onChange={(e) => updateField('annualInsurance', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Review Your Listing
              </h2>

              {submitError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                  {submitError}
                </div>
              )}

              <div className="space-y-4">
                {/* Basic Info Summary */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Basic Info</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-500">Title:</dt>
                    <dd className="text-gray-900 dark:text-white">{formData.title}</dd>
                    <dt className="text-gray-500">Type:</dt>
                    <dd className="text-gray-900 dark:text-white capitalize">
                      {formData.propertyType.replace(/_/g, ' ')}
                    </dd>
                    <dt className="text-gray-500">Listing:</dt>
                    <dd className="text-gray-900 dark:text-white capitalize">
                      {formData.listingType === 'sale' ? 'For Sale' : formData.listingType === 'rent' ? 'For Rent' : 'Lease to Own'}
                    </dd>
                  </dl>
                </div>

                {/* Location Summary */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Location</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.address}
                    {formData.addressLine2 && `, ${formData.addressLine2}`}
                    <br />
                    {formData.city}, {formData.state} {formData.zipCode}
                  </p>
                </div>

                {/* Specs Summary */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Property Specs</h3>
                  <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {formData.bedrooms && (
                      <>
                        <dt className="text-gray-500">Bedrooms:</dt>
                        <dd className="text-gray-900 dark:text-white">{formData.bedrooms}</dd>
                      </>
                    )}
                    {formData.bathrooms && (
                      <>
                        <dt className="text-gray-500">Bathrooms:</dt>
                        <dd className="text-gray-900 dark:text-white">{formData.bathrooms}</dd>
                      </>
                    )}
                    {formData.squareFeet && (
                      <>
                        <dt className="text-gray-500">Sq. Ft.:</dt>
                        <dd className="text-gray-900 dark:text-white">
                          {parseInt(formData.squareFeet).toLocaleString()}
                        </dd>
                      </>
                    )}
                    {formData.yearBuilt && (
                      <>
                        <dt className="text-gray-500">Year Built:</dt>
                        <dd className="text-gray-900 dark:text-white">{formData.yearBuilt}</dd>
                      </>
                    )}
                  </dl>
                </div>

                {/* Pricing Summary */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Pricing</h3>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${parseFloat(formData.price || '0').toLocaleString()}
                    {formData.listingType === 'rent' && <span className="text-base font-normal">/mo</span>}
                  </p>
                  {formData.isInvestment && (
                    <p className="text-sm text-gray-500 mt-1">
                      Investment property
                      {formData.capRate && ` • ${formData.capRate}% cap rate`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Spinner size="sm" className="mr-2" /> : null}
              {submitting ? 'Creating...' : 'Create Listing'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
