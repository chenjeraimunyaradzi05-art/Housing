'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface CoInvestmentPool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  targetAmount: string;
  raisedAmount: string;
  minInvestment: string;
  expectedReturn: string | null;
  holdPeriod: number | null;
  status: string;
  riskLevel: string;
  propertyType: string | null;
  location: string | null;
  images: string[] | null;
}

interface PoolsResponse {
  pools: CoInvestmentPool[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CoInvestPage() {
  const [pools, setPools] = useState<CoInvestmentPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPools() {
      try {
        const response = await api.get<PoolsResponse>('/co-invest/pools');
        if (response.success && response.data) {
           setPools(response.data.pools);
        } else {
           setError(response.error?.message || 'Failed to fetch pools');
        }
      } catch (err) {
        console.error('Error fetching pools:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchPools();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return (
    <div className="p-4">
      <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
        Error: {error}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Co-Investment Opportunities</h1>
          <p className="text-gray-500">Invest in fractional real estate assets tailored to your goals</p>
        </div>
      </div>

      {pools.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-500 mb-2">No investment opportunities found</div>
          <p className="text-sm text-gray-400">Check back later for new properties</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => (
             <InvestmentCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvestmentCard({ pool }: { pool: CoInvestmentPool }) {
  const target = parseFloat(pool.targetAmount);
  const raised = parseFloat(pool.raisedAmount);
  const progress = target > 0 ? (raised / target) * 100 : 0;

  // Parse images if it's a JSON string (sometimes Prisma returns JSON as objects, sometimes string if not typed well in frontend)
  // The interface says string[] | null, but let's be safe
  let imageUrl: string | null = null;
  if (Array.isArray(pool.images) && pool.images.length > 0) {
      imageUrl = pool.images[0];
  }

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'active': return 'success';
          case 'seeking': return 'primary';
          case 'funded': return 'default';
          default: return 'secondary';
      }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <div className="h-48 bg-gray-100 w-full relative border-b border-gray-100">
         {imageUrl ? (
             <img src={imageUrl} alt={pool.name} className="w-full h-full object-cover" />
         ) : (
             <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                <span className="text-4xl">🏢</span>
             </div>
         )}
         <div className="absolute top-3 right-3">
             <Badge variant={getStatusColor(pool.status) as any} className="uppercase text-xs font-bold tracking-wider">
                {pool.status}
             </Badge>
         </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{pool.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">{pool.description}</p>

        <div className="space-y-3 mb-6">
           <div className="flex justify-between text-sm items-center">
             <span className="text-gray-500">Target Raise</span>
             <span className="font-semibold text-gray-900">${target.toLocaleString()}</span>
           </div>

           <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
             <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
           </div>

           <div className="flex justify-between text-xs text-gray-500">
             <span>${raised.toLocaleString()} raised</span>
             <span className="font-medium">{Math.round(progress)}%</span>
           </div>

           <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Return</div>
                    <div className="font-bold text-green-600">{pool.expectedReturn ? `${pool.expectedReturn}%` : 'TBD'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Min Invest</div>
                    <div className="font-bold text-gray-900">${parseFloat(pool.minInvestment).toLocaleString()}</div>
                </div>
           </div>
        </div>

        <div className="mt-auto">
           <Link href={`/dashboard/invest/${pool.id}`} className="block w-full">
             <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white">View Opportunity</Button>
           </Link>
        </div>
      </div>
    </Card>
  );
}
