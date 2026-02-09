'use client';

import { useState, useEffect } from 'react';
import { Card, Spinner, Button } from '@/components/ui';

interface AgentProfile {
  id: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  specializations: string[];
  regions: string[];
  languages: string[];
  yearsExperience: number;
  totalTransactions: number;
  avgRating: number;
  reviewCount: number;
  responseTime: number | null;
  tier: string;
  verificationStatus: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  reviewerName: string;
  transactionType: string;
  isVerified: boolean;
  createdAt: string;
}

interface LeadForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyInterest: string;
  budget: string;
  message: string;
}

const MOCK_AGENTS: AgentProfile[] = [
  {
    id: '1', displayName: 'Sarah Chen', bio: 'Luxury residential specialist with 12 years helping women find their dream homes.',
    avatar: null, specializations: ['residential', 'luxury', 'first_time'],
    regions: ['California', 'Nevada'], languages: ['English', 'Mandarin'],
    yearsExperience: 12, totalTransactions: 245, avgRating: 4.9, reviewCount: 187,
    responseTime: 15, tier: 'platinum', verificationStatus: 'verified',
  },
  {
    id: '2', displayName: 'Maria Rodriguez', bio: 'Commercial real estate expert focused on women-owned business spaces.',
    avatar: null, specializations: ['commercial', 'investment'],
    regions: ['Texas', 'Florida'], languages: ['English', 'Spanish'],
    yearsExperience: 8, totalTransactions: 132, avgRating: 4.8, reviewCount: 98,
    responseTime: 30, tier: 'gold', verificationStatus: 'verified',
  },
  {
    id: '3', displayName: 'Aisha Johnson', bio: 'First-time homebuyer champion. Making homeownership accessible for all women.',
    avatar: null, specializations: ['residential', 'first_time'],
    regions: ['New York', 'New Jersey'], languages: ['English'],
    yearsExperience: 5, totalTransactions: 78, avgRating: 4.7, reviewCount: 62,
    responseTime: 20, tier: 'silver', verificationStatus: 'verified',
  },
  {
    id: '4', displayName: 'Emily Park', bio: 'Investment property specialist helping women build generational wealth through real estate.',
    avatar: null, specializations: ['investment', 'multi_family'],
    regions: ['Washington', 'Oregon'], languages: ['English', 'Korean'],
    yearsExperience: 10, totalTransactions: 189, avgRating: 4.85, reviewCount: 143,
    responseTime: 25, tier: 'gold', verificationStatus: 'verified',
  },
];

const MOCK_REVIEWS: Review[] = [
  { id: '1', rating: 5, title: 'Best experience ever!', content: 'Sarah helped me find the perfect investment property. Her knowledge of the market is incredible.', reviewerName: 'Jennifer T.', transactionType: 'purchase', isVerified: true, createdAt: '2026-01-15' },
  { id: '2', rating: 5, title: 'Highly recommend', content: 'Maria went above and beyond to help me secure a great commercial space for my business.', reviewerName: 'Lisa M.', transactionType: 'purchase', isVerified: true, createdAt: '2026-01-10' },
  { id: '3', rating: 4, title: 'Great support for first-time buyers', content: 'Aisha was patient and explained everything thoroughly. Felt supported the entire time.', reviewerName: 'Priya K.', transactionType: 'purchase', isVerified: true, createdAt: '2026-01-08' },
];

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'reviews' | 'become-agent' | 'partners'>('directory');
  const [agents, setAgents] = useState<AgentProfile[]>(MOCK_AGENTS);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpec, setFilterSpec] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showContactForm, setShowContactForm] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>({
    clientName: '', clientEmail: '', clientPhone: '',
    propertyInterest: '', budget: '', message: '',
  });

  const filteredAgents = agents.filter(a => {
    if (searchQuery && !a.displayName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterSpec !== 'all' && !a.specializations.includes(filterSpec)) return false;
    if (filterRegion !== 'all' && !a.regions.includes(filterRegion)) return false;
    return true;
  });

  const allRegions = [...new Set(agents.flatMap(a => a.regions))].sort();
  const allSpecs = [...new Set(agents.flatMap(a => a.specializations))].sort();

  const tierColors: Record<string, string> = {
    platinum: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    silver: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const tabs = [
    { key: 'directory', label: 'Agent Directory', icon: '👩‍💼' },
    { key: 'reviews', label: 'Reviews', icon: '⭐' },
    { key: 'partners', label: 'Partners', icon: '🤝' },
    { key: 'become-agent', label: 'Become an Agent', icon: '📋' },
  ] as const;

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
    ));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent & Partner Network</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect with verified women-led and women-supporting real estate professionals
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agent Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text" placeholder="Search agents..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <option value="all">All Specializations</option>
              {allSpecs.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <option value="all">All Regions</option>
              {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Agent Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-2xl font-bold text-rose-600">
                    {agent.displayName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{agent.displayName}</h3>
                      {agent.verificationStatus === 'verified' && <span className="text-green-500 text-sm">✓</span>}
                      <span className={`text-xs px-2 py-0.5 rounded ${tierColors[agent.tier] || ''}`}>
                        {agent.tier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{agent.bio}</p>

                    <div className="flex items-center gap-1 text-sm mb-2">
                      {renderStars(agent.avgRating)}
                      <span className="text-gray-600 ml-1">{agent.avgRating} ({agent.reviewCount})</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.specializations.map(s => (
                        <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {s.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500 mb-3">
                      <span>{agent.yearsExperience} yrs exp</span>
                      <span>{agent.totalTransactions} transactions</span>
                      {agent.responseTime && <span>~{agent.responseTime}min response</span>}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setSelectedAgent(agent); setShowContactForm(true); }}>
                        Contact Agent
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Form Modal */}
          {showContactForm && selectedAgent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Contact {selectedAgent.displayName}</h3>
                  <button onClick={() => setShowContactForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="Your Name" value={leadForm.clientName}
                    onChange={(e) => setLeadForm(p => ({ ...p, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                  <input type="email" placeholder="Email" value={leadForm.clientEmail}
                    onChange={(e) => setLeadForm(p => ({ ...p, clientEmail: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                  <input type="tel" placeholder="Phone" value={leadForm.clientPhone}
                    onChange={(e) => setLeadForm(p => ({ ...p, clientPhone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                  <input type="text" placeholder="Property Interest" value={leadForm.propertyInterest}
                    onChange={(e) => setLeadForm(p => ({ ...p, propertyInterest: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                  <input type="text" placeholder="Budget Range" value={leadForm.budget}
                    onChange={(e) => setLeadForm(p => ({ ...p, budget: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                  <textarea placeholder="Message..." value={leadForm.message}
                    onChange={(e) => setLeadForm(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                  <Button className="w-full" onClick={() => { setShowContactForm(false); }}>
                    Send Message
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Agent Reviews</h2>
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    {review.isVerified && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{review.title}</h3>
                </div>
                <span className="text-xs text-gray-500">{review.createdAt}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{review.content}</p>
              <p className="text-xs text-gray-500">— {review.reviewerName} • {review.transactionType}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Partner Network</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Women\'s Mortgage Co.', category: 'Lender', desc: 'Women-led mortgage lender with competitive rates', status: 'Premium Partner' },
              { name: 'SafeGuard Title', category: 'Title Company', desc: 'Fast and reliable title services for all transactions', status: 'Partner' },
              { name: 'HomeShield Insurance', category: 'Insurance', desc: 'Comprehensive property insurance with women-focused plans', status: 'Partner' },
              { name: 'TrustVerify Inspections', category: 'Inspection', desc: 'Thorough home inspections by certified professionals', status: 'Partner' },
              { name: 'WealthWise CPA', category: 'Accounting', desc: 'Tax planning and accounting for real estate investors', status: 'Premium Partner' },
              { name: 'EqualJustice Legal', category: 'Legal', desc: 'Real estate law firm specializing in women\'s property rights', status: 'Partner' },
            ].map((partner, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{partner.category}</span>
                  {partner.status === 'Premium Partner' && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Premium</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{partner.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{partner.desc}</p>
                <Button variant="outline" size="sm">Learn More</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Become an Agent Tab */}
      {activeTab === 'become-agent' && (
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Become a VÖR Agent</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join our network of women-led and women-supporting real estate professionals.
            </p>

            <div className="space-y-6 mb-8">
              {[
                { title: 'Verified Profile', desc: 'Get a verified badge that builds trust with clients' },
                { title: 'Lead Generation', desc: 'Receive qualified leads from women looking to buy, sell, or invest' },
                { title: 'Commission Tracking', desc: 'Track earnings, referrals, and payouts all in one place' },
                { title: 'CRM Tools', desc: 'Manage clients, follow-ups, and transactions efficiently' },
                { title: 'Tier Rewards', desc: 'Earn higher commission rates and visibility as you grow' },
              ].map((benefit, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{benefit.title}</h4>
                    <p className="text-sm text-gray-500">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">License Number</label>
                  <input type="text" placeholder="RE-12345678" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">License State</label>
                  <input type="text" placeholder="California" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Brokerage Name</label>
                <input type="text" placeholder="Your brokerage" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {['residential', 'commercial', 'luxury', 'first_time', 'investment', 'rental'].map(s => (
                    <label key={s} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" className="w-4 h-4" />
                      {s.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Bio</label>
                <textarea rows={3} placeholder="Tell us about your experience..." className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <Button className="w-full">Apply to Become an Agent</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
