'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface CoInvestmentPool {
  id: string;
  name: string;
  description: string | null;
  targetAmount: string;
  raisedAmount: string;
  minInvestment: string;
  sharePrice: string;
  availableShares: number;
  expectedReturn: string | null;
  holdPeriod: number | null;
  status: string;
  riskLevel: string;
  propertyType: string | null;
  location: string | null;
  images: string[] | null;
  highlights: string[] | null;
  documents: any[] | null;
}

export default function InvestmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [pool, setPool] = useState<CoInvestmentPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchPool() {
      try {
        const response = await api.get(`/co-invest/pools/${id}`);
        if (response.success && response.data) {
           setPool(response.data as CoInvestmentPool);
        } else {
           setError(response.error?.message || 'Failed to fetch investment details');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchPool();
  }, [id]);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (error || !pool) return (
    <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-600">{error || 'Investment not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  const target = parseFloat(pool.targetAmount);
  const raised = parseFloat(pool.raisedAmount);
  const progress = target > 0 ? (raised / target) * 100 : 0;
  const imageUrl = (pool.images && pool.images.length > 0) ? pool.images[0] : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Section with Image */}
      <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden bg-gray-100 shadow-sm">
         {imageUrl ? (
             <img src={imageUrl} alt={pool.name} className="w-full h-full object-cover" />
         ) : (
             <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-6xl">🏢</span>
             </div>
         )}
         <div className="absolute top-4 right-4 flex gap-2">
             <Badge variant="default" className="bg-white/90 text-gray-900 backdrop-blur-sm">{pool.riskLevel} Risk</Badge>
             <Badge variant={pool.status === 'active' ? 'success' : 'secondary'} className="uppercase">
                {pool.status}
             </Badge>
         </div>
         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{pool.name}</h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
                <span>📍 {pool.location || 'Location Pending'}</span>
                <span>•</span>
                <span>{pool.propertyType || 'Real Estate'}</span>
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
           <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                 <TabsTrigger value="overview">Overview</TabsTrigger>
                 <TabsTrigger value="financials">Financials</TabsTrigger>
                 <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                 <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">About this Opportunity</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{pool.description}</p>
                 </Card>

                 {pool.highlights && pool.highlights.length > 0 && (
                     <Card className="p-6">
                        <h3 className="font-bold mb-4">Investment Highlights</h3>
                        <ul className="space-y-2">
                            {pool.highlights.map((highlight, idx) => (
                                <li key={idx} className="flex gap-2 text-gray-700">
                                    <span className="text-green-500">✓</span> {highlight}
                                </li>
                            ))}
                        </ul>
                     </Card>
                 )}
              </TabsContent>

              <TabsContent value="financials">
                  <Card className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <p className="text-sm text-gray-500">Share Price</p>
                              <p className="text-xl font-bold text-gray-900">${parseFloat(pool.sharePrice).toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-sm text-gray-500">Total Shares</p>
                              <p className="text-xl font-bold text-gray-900">{(target / parseFloat(pool.sharePrice)).toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-sm text-gray-500">Available Shares</p>
                              <p className="text-xl font-bold text-gray-900">{pool.availableShares.toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-sm text-gray-500">Hold Period</p>
                              <p className="text-xl font-bold text-gray-900">{pool.holdPeriod} Months</p>
                          </div>
                      </div>
                  </Card>
              </TabsContent>

              <TabsContent value="documents">
                 <Card className="p-6">
                     <p className="text-gray-500 italic">No documents available for public view.</p>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>

        {/* Sidebar Investment Box */}
        <div className="space-y-6">
            <Card className="p-6 sticky top-6 border-blue-100 shadow-md">
                <h3 className="text-lg font-bold mb-4">Investment Status</h3>

                <div className="space-y-4 mb-6">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Raised</span>
                            <span className="font-bold">${raised.toLocaleString()} / ${target.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                        <div>
                             <p className="text-xs text-gray-500">Est. Return</p>
                             <p className="text-2xl font-bold text-green-600">{pool.expectedReturn}%</p>
                        </div>
                        <div>
                             <p className="text-xs text-gray-500">Min Investment</p>
                             <p className="text-2xl font-bold text-gray-900">${parseFloat(pool.minInvestment).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg" disabled={pool.status !== 'active'}>
                       {pool.status === 'active' ? 'Invest Now' : 'Not Available'}
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                        By clicking Invest Now, you agree to our terms of service.
                    </p>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
