/**
 * Property Valuation Service (AVM - Automated Valuation Model)
 * Provides AI-powered property value estimates
 */

import { prisma } from '../prisma';

export interface PropertyFeatures {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize?: number;
  propertyType: string;
  zipCode: string;
  city: string;
  state: string;
  hasGarage?: boolean;
  hasPool?: boolean;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ValuationResult {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  confidence: number;
  comparables: ComparableProperty[];
  factors: ValuationFactor[];
  generatedAt: Date;
}

export interface ComparableProperty {
  id: string;
  address: string;
  salePrice: number;
  saleDate: Date;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  distance: number; // miles
  similarity: number; // 0-1
}

export interface ValuationFactor {
  name: string;
  impact: number; // positive or negative dollar amount
  description: string;
}

// Price per square foot by property type (simplified model)
const BASE_PRICE_PER_SQFT: Record<string, number> = {
  'single_family': 250,
  'condo': 300,
  'townhouse': 275,
  'multi_family': 200,
  'land': 50,
};

// Regional multipliers (simplified)
const REGIONAL_MULTIPLIERS: Record<string, number> = {
  'CA': 1.8,
  'NY': 1.6,
  'TX': 0.9,
  'FL': 1.1,
  'WA': 1.4,
  'CO': 1.3,
  'default': 1.0,
};

/**
 * Calculate property valuation using a simplified AVM model
 */
export async function calculatePropertyValuation(
  features: PropertyFeatures
): Promise<ValuationResult> {
  // Get base price per square foot
  const basePricePerSqft = BASE_PRICE_PER_SQFT[features.propertyType] || 250;

  // Apply regional multiplier
  const regionalMultiplier = REGIONAL_MULTIPLIERS[features.state] || REGIONAL_MULTIPLIERS['default'];

  // Calculate base value
  let baseValue = features.squareFeet * basePricePerSqft * regionalMultiplier;

  // Collect valuation factors
  const factors: ValuationFactor[] = [];

  // Age adjustment (depreciation for older homes, premium for newer)
  const age = new Date().getFullYear() - features.yearBuilt;
  let ageAdjustment = 0;
  if (age < 5) {
    ageAdjustment = baseValue * 0.05;
    factors.push({
      name: 'New Construction Premium',
      impact: ageAdjustment,
      description: 'Property is less than 5 years old',
    });
  } else if (age > 50) {
    ageAdjustment = -baseValue * 0.15;
    factors.push({
      name: 'Age Depreciation',
      impact: ageAdjustment,
      description: 'Property is over 50 years old',
    });
  }
  baseValue += ageAdjustment;

  // Bedroom/bathroom premium
  const bedroomPremium = (features.bedrooms - 3) * 15000;
  if (bedroomPremium !== 0) {
    factors.push({
      name: 'Bedroom Adjustment',
      impact: bedroomPremium,
      description: `${features.bedrooms} bedrooms (vs 3 bedroom baseline)`,
    });
    baseValue += bedroomPremium;
  }

  const bathroomPremium = (features.bathrooms - 2) * 10000;
  if (bathroomPremium !== 0) {
    factors.push({
      name: 'Bathroom Adjustment',
      impact: bathroomPremium,
      description: `${features.bathrooms} bathrooms (vs 2 bathroom baseline)`,
    });
    baseValue += bathroomPremium;
  }

  // Amenity premiums
  if (features.hasGarage) {
    factors.push({
      name: 'Garage',
      impact: 25000,
      description: 'Property has garage',
    });
    baseValue += 25000;
  }

  if (features.hasPool) {
    factors.push({
      name: 'Pool',
      impact: 35000,
      description: 'Property has swimming pool',
    });
    baseValue += 35000;
  }

  // Condition adjustment
  const conditionMultipliers: Record<string, number> = {
    'excellent': 1.1,
    'good': 1.0,
    'fair': 0.9,
    'poor': 0.75,
  };
  const conditionMultiplier = conditionMultipliers[features.condition || 'good'];
  const conditionAdjustment = baseValue * (conditionMultiplier - 1);
  if (conditionAdjustment !== 0) {
    factors.push({
      name: 'Condition Adjustment',
      impact: conditionAdjustment,
      description: `Property condition: ${features.condition || 'good'}`,
    });
    baseValue *= conditionMultiplier;
  }

  // Round to nearest $1000
  const estimatedValue = Math.round(baseValue / 1000) * 1000;

  // Calculate confidence interval (±10% with 80% confidence)
  const confidence = 0.80;
  const margin = 0.10;
  const lowEstimate = Math.round(estimatedValue * (1 - margin) / 1000) * 1000;
  const highEstimate = Math.round(estimatedValue * (1 + margin) / 1000) * 1000;

  // Generate mock comparables
  const comparables = generateMockComparables(features, estimatedValue);

  return {
    estimatedValue,
    lowEstimate,
    highEstimate,
    confidence,
    comparables,
    factors,
    generatedAt: new Date(),
  };
}

/**
 * Generate mock comparable properties for demonstration
 */
function generateMockComparables(
  features: PropertyFeatures,
  baseValue: number
): ComparableProperty[] {
  const comparables: ComparableProperty[] = [];

  for (let i = 0; i < 5; i++) {
    const variance = (Math.random() - 0.5) * 0.2; // ±10%
    const sqftVariance = (Math.random() - 0.5) * 0.15; // ±7.5%

    comparables.push({
      id: `comp-${i + 1}`,
      address: `${100 + i * 20} ${['Oak', 'Maple', 'Pine', 'Cedar', 'Elm'][i]} St, ${features.city}, ${features.state}`,
      salePrice: Math.round(baseValue * (1 + variance) / 1000) * 1000,
      saleDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      squareFeet: Math.round(features.squareFeet * (1 + sqftVariance)),
      bedrooms: features.bedrooms + Math.floor(Math.random() * 2) - 1,
      bathrooms: features.bathrooms + Math.floor(Math.random() * 2) - 1,
      distance: Math.round(Math.random() * 20) / 10,
      similarity: 0.75 + Math.random() * 0.2,
    });
  }

  return comparables.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get valuation for existing property in database
 */
export async function valuatePropertyById(propertyId: string): Promise<ValuationResult | null> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    return null;
  }

  const features: PropertyFeatures = {
    bedrooms: property.bedrooms || 3,
    bathrooms: Number(property.bathrooms) || 2,
    squareFeet: property.squareFeet || 1500,
    yearBuilt: property.yearBuilt || 2000,
    propertyType: property.propertyType || 'single_family',
    zipCode: property.zipCode || '00000',
    city: property.city,
    state: property.state,
  };

  return calculatePropertyValuation(features);
}
