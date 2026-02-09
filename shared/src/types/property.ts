// Property Types
export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  
  // Property details
  type: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sqFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  
  // Valuation
  estimatedValue: number;
  lastAppraisalValue?: number;
  lastAppraisalDate?: string;
  
  // Rental info
  monthlyRent?: number;
  rentFrequency: 'monthly' | 'annual';
  occupancyRate?: number;
  
  // Status
  status: PropertyStatus;
  
  // Ownership
  ownerId: string;
  
  // Media
  images: PropertyImage[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = 'residential' | 'commercial' | 'multi-family' | 'land';
export type PropertyStatus = 'available' | 'rented' | 'for_sale' | 'development';

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
}

// Co-Investment Types
export interface CoInvestmentPool {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: PoolStatus;
  propertyId: string;
  property?: Property;
  creatorId: string;
  investorCount: number;
  minInvestment: number;
  maxInvestment?: number;
  expectedReturn?: number;
  contractAddress?: string;
  tokenAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export type PoolStatus = 'seeking' | 'active' | 'completed' | 'liquidated';

export interface CoInvestmentInvestor {
  id: string;
  poolId: string;
  userId: string;
  investmentAmount: number;
  sharesOwned: number;
  percentageOwned: number;
  joinedAt: string;
}

export interface Investment {
  id: string;
  pool: CoInvestmentPool;
  investmentAmount: number;
  sharesOwned: number;
  percentageOwned: number;
  distributions: Distribution[];
  totalDistributed: number;
  joinedAt: string;
}

export interface Distribution {
  id: string;
  amount: number;
  type: 'dividend' | 'capital_return' | 'income';
  distributedAt: string;
  txHash?: string;
}
