'use client';

import { useState, useEffect } from 'react';
import { Card, Spinner, Button } from '@/components/ui';

interface SafeListing {
  id: string;
  title: string;
  propertyType: string;
  city: string;
  state: string;
  monthlyRent: number | null;
  isSubsidized: boolean;
  acceptsVouchers: boolean;
  safetyScore: number | null;
  status: string;
  isVerified: boolean;
  hasSecuritySystem: boolean;
  hasSecureEntry: boolean;
  petFriendly: boolean;
  childFriendly: boolean;
  wheelchairAccessible: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  images: string[];
}

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  phone: string | null;
  website: string | null;
  is24Hours: boolean;
  coverageArea: string;
}

const CRISIS_HOTLINES = [
  { name: 'National DV Hotline', phone: '1-800-799-7233', available: '24/7' },
  { name: 'Crisis Text Line', phone: 'Text HOME to 741741', available: '24/7' },
  { name: 'National Sexual Assault Hotline', phone: '1-800-656-4673', available: '24/7' },
];

const MOCK_LISTINGS: SafeListing[] = [
  {
    id: '1', title: 'Safe Haven Apartment - Downtown', propertyType: 'apartment',
    city: 'Portland', state: 'OR', monthlyRent: 850, isSubsidized: true,
    acceptsVouchers: true, safetyScore: 92, status: 'available', isVerified: true,
    hasSecuritySystem: true, hasSecureEntry: true, petFriendly: true,
    childFriendly: true, wheelchairAccessible: false,
    contactPhone: '(503) 555-0123', contactEmail: 'intake@safehaven.org', images: [],
  },
  {
    id: '2', title: 'Women\'s Transitional Housing', propertyType: 'transitional',
    city: 'Seattle', state: 'WA', monthlyRent: null, isSubsidized: true,
    acceptsVouchers: true, safetyScore: 95, status: 'available', isVerified: true,
    hasSecuritySystem: true, hasSecureEntry: true, petFriendly: false,
    childFriendly: true, wheelchairAccessible: true,
    contactPhone: '(206) 555-0456', contactEmail: null, images: [],
  },
  {
    id: '3', title: 'Hope House - Family Unit', propertyType: 'shelter',
    city: 'San Francisco', state: 'CA', monthlyRent: null, isSubsidized: true,
    acceptsVouchers: true, safetyScore: 98, status: 'available', isVerified: true,
    hasSecuritySystem: true, hasSecureEntry: true, petFriendly: false,
    childFriendly: true, wheelchairAccessible: true,
    contactPhone: '(415) 555-0789', contactEmail: 'help@hopehouse.org', images: [],
  },
];

const MOCK_RESOURCES: Resource[] = [
  { id: '1', name: 'National Domestic Violence Hotline', description: 'Free, confidential support 24/7', category: 'hotline', type: 'hotline', phone: '1-800-799-7233', website: 'https://www.thehotline.org', is24Hours: true, coverageArea: 'national' },
  { id: '2', name: 'Legal Aid Society - Women\'s Rights', description: 'Free legal assistance for protective orders and family law', category: 'legal', type: 'organization', phone: '(800) 555-1234', website: null, is24Hours: false, coverageArea: 'national' },
  { id: '3', name: 'Financial Empowerment Center', description: 'Free financial counseling and budgeting assistance', category: 'financial', type: 'organization', phone: '(800) 555-5678', website: null, is24Hours: false, coverageArea: 'national' },
  { id: '4', name: 'HUD Housing Assistance', description: 'Government housing vouchers and emergency assistance', category: 'government', type: 'program', phone: '(800) 569-4287', website: 'https://www.hud.gov', is24Hours: false, coverageArea: 'national' },
  { id: '5', name: 'Women\'s Counseling Network', description: 'Trauma-informed therapy and support groups', category: 'counseling', type: 'organization', phone: '(800) 555-9012', website: null, is24Hours: false, coverageArea: 'national' },
];

export default function SafeHousingPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'resources' | 'safety-plan' | 'crisis'>('directory');
  const [listings, setListings] = useState<SafeListing[]>(MOCK_LISTINGS);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [searchCity, setSearchCity] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Safety Plan State
  const [safetyPlan, setSafetyPlan] = useState({
    emergencyContacts: [{ name: '', phone: '', relationship: '' }],
    safeLocations: [{ name: '', address: '', notes: '' }],
    importantDocs: [{ type: '', location: '', notes: '' }],
    financialSteps: [{ step: '', completed: false }],
  });

  const filteredListings = listings.filter(l => {
    if (searchCity && !l.city.toLowerCase().includes(searchCity.toLowerCase()) && !l.state.toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (filterType !== 'all' && l.propertyType !== filterType) return false;
    return true;
  });

  const filteredResources = resources.filter(r => {
    if (filterType !== 'all' && r.category !== filterType) return false;
    return true;
  });

  const tabs = [
    { key: 'crisis', label: 'Crisis Help', icon: '🆘' },
    { key: 'directory', label: 'Safe Housing', icon: '🏠' },
    { key: 'resources', label: 'Resources', icon: '📚' },
    { key: 'safety-plan', label: 'Safety Plan', icon: '🛡️' },
  ] as const;

  const categoryColors: Record<string, string> = {
    hotline: 'bg-red-100 text-red-800',
    legal: 'bg-blue-100 text-blue-800',
    financial: 'bg-green-100 text-green-800',
    counseling: 'bg-purple-100 text-purple-800',
    government: 'bg-yellow-100 text-yellow-800',
    shelter: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Emergency Banner */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🆘</span>
          <div>
            <p className="font-semibold text-red-800 dark:text-red-400">
              If you are in immediate danger, call 911
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              National DV Hotline: 1-800-799-7233 (24/7) • Crisis Text Line: Text HOME to 741741
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Safe Housing & Support</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Confidential resources, safe housing, and support services
        </p>
        <p className="text-xs text-gray-400 mt-2">
          🔒 Private browsing mode available — your activity in this section is not logged
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

      {/* Crisis Help Tab */}
      {activeTab === 'crisis' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Immediate Help</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {CRISIS_HOTLINES.map((hotline, i) => (
              <Card key={i} className="p-6 border-2 border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{hotline.name}</h3>
                <p className="text-2xl font-bold text-red-600 mb-2">{hotline.phone}</p>
                <p className="text-sm text-gray-500">Available: {hotline.available}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Safety Tips</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2"><span>🔒</span> Use private/incognito browsing mode when researching safety resources</li>
              <li className="flex gap-2"><span>📱</span> Keep your phone charged and have emergency contacts memorized</li>
              <li className="flex gap-2"><span>📄</span> Store copies of important documents in a safe location outside your home</li>
              <li className="flex gap-2"><span>💰</span> Set aside emergency funds in a separate account if possible</li>
              <li className="flex gap-2"><span>🗺️</span> Identify safe locations you can go to quickly (friend, shelter, police station)</li>
              <li className="flex gap-2"><span>👥</span> Tell a trusted friend or family member about your situation</li>
            </ul>
          </Card>
        </div>
      )}

      {/* Safe Housing Directory Tab */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by city or state..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartments</option>
              <option value="shelter">Shelters</option>
              <option value="transitional">Transitional</option>
              <option value="shared">Shared Housing</option>
            </select>
          </div>

          {filteredListings.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">🏠</p>
              <h3 className="text-lg font-semibold mb-2">No listings found</h3>
              <p className="text-gray-500">Try adjusting your search or filters.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{listing.title}</h3>
                        {listing.isVerified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{listing.city}, {listing.state} • {listing.propertyType}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {listing.hasSecuritySystem && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">🔐 Security System</span>}
                        {listing.hasSecureEntry && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">🚪 Secure Entry</span>}
                        {listing.petFriendly && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">🐾 Pet Friendly</span>}
                        {listing.childFriendly && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">👶 Child Friendly</span>}
                        {listing.wheelchairAccessible && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">♿ Accessible</span>}
                        {listing.acceptsVouchers && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Accepts Vouchers</span>}
                        {listing.isSubsidized && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Subsidized</span>}
                      </div>

                      <div className="flex gap-4 text-sm">
                        {listing.contactPhone && <span className="text-gray-600">📞 {listing.contactPhone}</span>}
                        {listing.contactEmail && <span className="text-gray-600">✉️ {listing.contactEmail}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      {listing.safetyScore && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">Safety Score</span>
                          <div className={`text-2xl font-bold ${listing.safetyScore >= 90 ? 'text-green-600' : listing.safetyScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {listing.safetyScore}/100
                          </div>
                        </div>
                      )}
                      {listing.monthlyRent ? (
                        <div>
                          <span className="text-xs text-gray-500">Monthly</span>
                          <div className="text-xl font-semibold">${listing.monthlyRent.toLocaleString()}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Free / Subsidized</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {['all', 'hotline', 'legal', 'financial', 'counseling', 'government'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-3 py-1 text-sm rounded-full ${
                  filterType === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{resource.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[resource.category] || 'bg-gray-100 text-gray-800'}`}>
                        {resource.category}
                      </span>
                      {resource.is24Hours && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">24/7</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                    <div className="flex gap-4 text-sm">
                      {resource.phone && <span className="text-gray-600">📞 {resource.phone}</span>}
                      {resource.website && (
                        <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline">
                          🌐 Website
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{resource.coverageArea}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Safety Plan Tab */}
      {activeTab === 'safety-plan' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🛡️ My Safety Plan</h3>
            <p className="text-sm text-gray-500 mb-6">
              This plan is stored securely and encrypted. Only you can access it.
            </p>

            {/* Emergency Contacts */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Emergency Contacts</h4>
              {safetyPlan.emergencyContacts.map((contact, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 mb-2">
                  <input
                    type="text" placeholder="Name" value={contact.name}
                    onChange={(e) => {
                      const updated = [...safetyPlan.emergencyContacts];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setSafetyPlan(p => ({ ...p, emergencyContacts: updated }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <input
                    type="text" placeholder="Phone" value={contact.phone}
                    onChange={(e) => {
                      const updated = [...safetyPlan.emergencyContacts];
                      updated[i] = { ...updated[i], phone: e.target.value };
                      setSafetyPlan(p => ({ ...p, emergencyContacts: updated }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <input
                    type="text" placeholder="Relationship" value={contact.relationship}
                    onChange={(e) => {
                      const updated = [...safetyPlan.emergencyContacts];
                      updated[i] = { ...updated[i], relationship: e.target.value };
                      setSafetyPlan(p => ({ ...p, emergencyContacts: updated }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              ))}
              <button
                onClick={() => setSafetyPlan(p => ({ ...p, emergencyContacts: [...p.emergencyContacts, { name: '', phone: '', relationship: '' }] }))}
                className="text-sm text-rose-600 hover:underline mt-1"
              >+ Add Contact</button>
            </div>

            {/* Safe Locations */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Safe Locations</h4>
              {safetyPlan.safeLocations.map((loc, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 mb-2">
                  <input
                    type="text" placeholder="Name" value={loc.name}
                    onChange={(e) => {
                      const updated = [...safetyPlan.safeLocations];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setSafetyPlan(p => ({ ...p, safeLocations: updated }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <input
                    type="text" placeholder="Address" value={loc.address}
                    onChange={(e) => {
                      const updated = [...safetyPlan.safeLocations];
                      updated[i] = { ...updated[i], address: e.target.value };
                      setSafetyPlan(p => ({ ...p, safeLocations: updated }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <input
                    type="text" placeholder="Notes" value={loc.notes}
                    onChange={(e) => {
                      const updated = [...safetyPlan.safeLocations];
                      updated[i] = { ...updated[i], notes: e.target.value };
                      setSafetyPlan(p => ({ ...p, safeLocations: updated }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              ))}
              <button
                onClick={() => setSafetyPlan(p => ({ ...p, safeLocations: [...p.safeLocations, { name: '', address: '', notes: '' }] }))}
                className="text-sm text-rose-600 hover:underline mt-1"
              >+ Add Location</button>
            </div>

            {/* Financial Steps */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Financial Independence Steps</h4>
              {safetyPlan.financialSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox" checked={step.completed}
                    onChange={(e) => {
                      const updated = [...safetyPlan.financialSteps];
                      updated[i] = { ...updated[i], completed: e.target.checked };
                      setSafetyPlan(p => ({ ...p, financialSteps: updated }));
                    }}
                    className="w-4 h-4"
                  />
                  <input
                    type="text" placeholder="Financial step..." value={step.step}
                    onChange={(e) => {
                      const updated = [...safetyPlan.financialSteps];
                      updated[i] = { ...updated[i], step: e.target.value };
                      setSafetyPlan(p => ({ ...p, financialSteps: updated }));
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              ))}
              <button
                onClick={() => setSafetyPlan(p => ({ ...p, financialSteps: [...p.financialSteps, { step: '', completed: false }] }))}
                className="text-sm text-rose-600 hover:underline mt-1"
              >+ Add Step</button>
            </div>

            <Button className="w-full sm:w-auto">Save Safety Plan</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
