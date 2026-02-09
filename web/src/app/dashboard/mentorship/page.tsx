'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Mentor {
  id: string;
  name: string;
  headline: string;
  expertise: string[];
  yearsExperience: number;
  availability: string;
  rating: number;
  totalReviews: number;
  totalSessions: number;
  languages: string[];
  verified: boolean;
  bio: string;
  currentMentees: number;
  maxMentees: number;
}

interface MentorshipSession {
  id: string;
  mentorName: string;
  scheduledAt: string;
  durationMinutes: number;
  type: string;
  status: string;
  topic: string;
  notes?: string;
  meetingUrl?: string;
}

const MOCK_MENTORS: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Dr. Angela Foster',
    headline: 'Real Estate Investment Strategist | 15+ Years Experience',
    expertise: ['real_estate', 'investing', 'wealth_building'],
    yearsExperience: 15,
    availability: 'available',
    rating: 4.9,
    totalReviews: 47,
    totalSessions: 234,
    languages: ['English', 'Spanish'],
    verified: true,
    bio: 'Helping women build generational wealth through strategic real estate investing.',
    currentMentees: 3,
    maxMentees: 5,
  },
  {
    id: 'mentor-2',
    name: 'Sarah Kim, CPA',
    headline: 'Tax Optimization Expert for Real Estate Investors',
    expertise: ['tax', 'financing', 'investing'],
    yearsExperience: 10,
    availability: 'available',
    rating: 4.8,
    totalReviews: 32,
    totalSessions: 156,
    languages: ['English', 'Korean'],
    verified: true,
    bio: 'Specializing in tax strategies that maximize returns for women real estate investors.',
    currentMentees: 1,
    maxMentees: 3,
  },
  {
    id: 'mentor-3',
    name: 'Maria Rodriguez',
    headline: 'First-Time Homebuyer Advocate & Coach',
    expertise: ['first_time_buyer', 'negotiation', 'property_analysis'],
    yearsExperience: 8,
    availability: 'limited',
    rating: 4.7,
    totalReviews: 28,
    totalSessions: 112,
    languages: ['English', 'Spanish'],
    verified: true,
    bio: 'Guiding first-time buyers through every step of the homebuying journey.',
    currentMentees: 4,
    maxMentees: 4,
  },
  {
    id: 'mentor-4',
    name: 'Latisha Williams',
    headline: 'Commercial Real Estate & Portfolio Building Expert',
    expertise: ['real_estate', 'property_analysis', 'wealth_building'],
    yearsExperience: 12,
    availability: 'available',
    rating: 4.85,
    totalReviews: 39,
    totalSessions: 189,
    languages: ['English'],
    verified: true,
    bio: 'Building portfolios that create lasting wealth for women and their families.',
    currentMentees: 1,
    maxMentees: 3,
  },
];

const MOCK_SESSIONS: MentorshipSession[] = [
  {
    id: 'sess-1',
    mentorName: 'Dr. Angela Foster',
    scheduledAt: '2026-02-12T14:00:00Z',
    durationMinutes: 45,
    type: 'video',
    status: 'scheduled',
    topic: 'Investment Property Due Diligence Checklist',
    meetingUrl: '#',
  },
  {
    id: 'sess-2',
    mentorName: 'Dr. Angela Foster',
    scheduledAt: '2026-02-05T14:00:00Z',
    durationMinutes: 45,
    type: 'video',
    status: 'completed',
    topic: 'Analyzing Rental Market Trends',
    notes: 'Covered local market data sources, cap rate benchmarks, and rental demand indicators.',
  },
  {
    id: 'sess-3',
    mentorName: 'Dr. Angela Foster',
    scheduledAt: '2026-01-29T14:00:00Z',
    durationMinutes: 30,
    type: 'video',
    status: 'completed',
    topic: 'Setting Investment Goals & Strategy',
    notes: 'Defined 6-month goals, agreed on focus areas, and set weekly milestones.',
  },
];

const EXPERTISE_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  investing: 'Investing',
  wealth_building: 'Wealth Building',
  tax: 'Tax Strategy',
  financing: 'Financing',
  first_time_buyer: 'First-Time Buyer',
  negotiation: 'Negotiation',
  property_analysis: 'Property Analysis',
};

const EXPERTISE_OPTIONS = Object.keys(EXPERTISE_LABELS);

export default function MentorshipPage() {
  const [activeTab, setActiveTab] = useState<'find' | 'my-mentorships' | 'sessions' | 'check-in'>('find');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    programType: '6_month',
    goals: '',
    focusAreas: [] as string[],
  });
  const [checkInForm, setCheckInForm] = useState({
    content: '',
    challenges: '',
    nextSteps: '',
  });

  // Data states
  const [mentors, setMentors] = useState<Mentor[]>(MOCK_MENTORS);
  const [sessions, setSessions] = useState<MentorshipSession[]>(MOCK_SESSIONS);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMentors = useCallback(async () => {
    setLoadingMentors(true);
    try {
      const params = new URLSearchParams();
      if (expertiseFilter) params.set('expertise', expertiseFilter);
      if (availabilityFilter) params.set('availability', availabilityFilter);
      const qs = params.toString();
      const res = await api.get<{ mentors: Mentor[] }>(`/api/mentorship/mentors${qs ? `?${qs}` : ''}`);
      if (res.success && res.data) {
        setMentors(res.data.mentors);
      }
    } catch {
      // Fallback to mock data on error
    } finally {
      setLoadingMentors(false);
    }
  }, [expertiseFilter, availabilityFilter]);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get<{ sessions: MentorshipSession[] }>('/api/mentorship/sessions');
      if (res.success && res.data) {
        setSessions(res.data.sessions);
      }
    } catch {
      // Fallback to mock data on error
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'find') fetchMentors();
    if (activeTab === 'sessions') fetchSessions();
  }, [activeTab, fetchMentors, fetchSessions]);

  const filteredMentors = mentors.filter(m => {
    if (expertiseFilter && !m.expertise.includes(expertiseFilter)) {
      return false;
    }
    if (availabilityFilter && m.availability !== availabilityFilter) {
      return false;
    }
    return true;
  });

  const tabs = [
    { id: 'find' as const, label: 'Find a Mentor' },
    { id: 'my-mentorships' as const, label: 'My Mentorships' },
    { id: 'sessions' as const, label: 'Sessions' },
    { id: 'check-in' as const, label: 'Check-In' },
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const handleRequestMentorship = async () => {
    try {
      await api.post('/api/mentorship/request', {
        mentorId: selectedMentor?.id,
        programType: requestForm.programType,
        goals: requestForm.goals,
        focusAreas: requestForm.focusAreas,
      });
      showToast(`Mentorship request sent to ${selectedMentor?.name}! They will review shortly.`);
    } catch {
      showToast('Failed to send request. Please try again.', 'error');
    }
    setShowRequestModal(false);
    setSelectedMentor(null);
    setRequestForm({ programType: '6_month', goals: '', focusAreas: [] });
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/api/mentorship/check-in', {
        mentorshipId: 'ms-1',
        content: checkInForm.content,
        challenges: checkInForm.challenges,
        nextSteps: checkInForm.nextSteps,
      });
      showToast('Weekly check-in submitted successfully!');
    } catch {
      showToast('Failed to submit check-in. Please try again.', 'error');
    }
    setCheckInForm({ content: '', challenges: '', nextSteps: '' });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mentorship Network</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Connect with experienced mentors who empower your real estate journey
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Mentors', value: '127', icon: '👩‍🏫' },
          { label: 'Mentorships Completed', value: '1,842', icon: '🎓' },
          { label: 'Avg. Rating', value: '4.8/5', icon: '⭐' },
          { label: 'Success Stories', value: '94%', icon: '🏆' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'find' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={expertiseFilter}
              onChange={(e) => setExpertiseFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Expertise</option>
              {EXPERTISE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{EXPERTISE_LABELS[opt]}</option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
            </select>
          </div>

          {/* Mentor Cards */}
          {loadingMentors && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {!loadingMentors && filteredMentors.map((mentor) => (
              <div key={mentor.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {mentor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{mentor.name}</h3>
                      {mentor.verified && (
                        <span className="text-blue-500 text-sm" title="Verified Mentor">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{mentor.headline}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{mentor.bio}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mentor.expertise.map((exp) => (
                    <span key={exp} className="inline-block px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs rounded-full">
                      {EXPERTISE_LABELS[exp] || exp}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{mentor.yearsExperience} yrs</div>
                    <div className="text-gray-500 dark:text-gray-400">Experience</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                      {renderStars(mentor.rating)} <span className="text-gray-500">{mentor.rating}</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">{mentor.totalReviews} reviews</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{mentor.totalSessions}</div>
                    <div className="text-gray-500 dark:text-gray-400">Sessions</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      mentor.availability === 'available' ? 'bg-green-500' :
                      mentor.availability === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-gray-500 dark:text-gray-400 capitalize">{mentor.availability}</span>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-gray-500 dark:text-gray-400">{mentor.currentMentees}/{mentor.maxMentees} mentees</span>
                  </div>
                  <button
                    onClick={() => { setSelectedMentor(mentor); setShowRequestModal(true); }}
                    disabled={mentor.currentMentees >= mentor.maxMentees}
                    className="px-4 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {mentor.currentMentees >= mentor.maxMentees ? 'Full' : 'Request Mentorship'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">No mentors match your filters</p>
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-mentorships' && (
        <div className="space-y-6">
          {/* Active Mentorship Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Mentorship</h3>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">Active</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-xl font-bold text-rose-600">A</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Dr. Angela Foster</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">6-Month Program · Started Jan 15, 2026</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Progress</span>
                <span className="font-semibold text-gray-900 dark:text-white">53%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: '53%' }} />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Goals</h4>
              <ul className="space-y-1">
                {['Build first rental portfolio', 'Understand market analysis', 'Create investment strategy'].map((goal, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      i < 2 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                    }`}>
                      {i < 2 ? '✓' : '○'}
                    </span>
                    <span className={i < 2 ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">8</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Sessions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">2/3</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Milestones</div>
              </div>
              <div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">Feb 12</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Next Session</div>
              </div>
            </div>
          </div>

          {/* Suggested Topics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggested Session Topics</h3>
            <div className="space-y-2">
              {[
                'Market analysis basics',
                'Property evaluation criteria',
                'ROI calculation methods',
                'Comparable sales analysis',
                'Cash flow projections',
              ].map((topic) => (
                <div key={topic} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-900 dark:text-white">{topic}</span>
                  <button className="text-xs text-rose-600 dark:text-rose-400 hover:underline">Add to Next Session</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {loadingSessions && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
            </div>
          )}
          {!loadingSessions && sessions.map((session) => (
            <div key={session.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{session.topic}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      session.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : session.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    with {session.mentorName} · {session.durationMinutes} min · {session.type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  {session.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <span className="font-medium">Notes:</span> {session.notes}
                    </p>
                  )}
                </div>
                {session.status === 'scheduled' && session.meetingUrl && (
                  <a
                    href={session.meetingUrl}
                    className="px-4 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Join Call
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'check-in' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Progress Check-In</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Share your weekly progress with your mentor. Regular check-ins help keep your mentorship on track.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What did you accomplish this week?
              </label>
              <textarea
                value={checkInForm.content}
                onChange={(e) => setCheckInForm({ ...checkInForm, content: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="I researched three neighborhoods and ran comp analysis on two properties..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Challenges or blockers
              </label>
              <textarea
                value={checkInForm.challenges}
                onChange={(e) => setCheckInForm({ ...checkInForm, challenges: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="I'm struggling with understanding cap rates for multi-family..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next steps for the coming week
              </label>
              <textarea
                value={checkInForm.nextSteps}
                onChange={(e) => setCheckInForm({ ...checkInForm, nextSteps: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="Schedule property tours, finalize financing pre-approval..."
              />
            </div>
            <button
              onClick={handleCheckIn}
              disabled={!checkInForm.content}
              className="px-6 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Submit Check-In
            </button>
          </div>
        </div>
      )}

      {/* Request Mentorship Modal */}
      {showRequestModal && selectedMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Request Mentorship
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              with {selectedMentor.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program Type</label>
                <select
                  value={requestForm.programType}
                  onChange={(e) => setRequestForm({ ...requestForm, programType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                >
                  <option value="90_day">90-Day Intensive</option>
                  <option value="6_month">6-Month Program</option>
                  <option value="annual">Annual Mentorship</option>
                  <option value="open_ended">Open-Ended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Goals</label>
                <textarea
                  value={requestForm.goals}
                  onChange={(e) => setRequestForm({ ...requestForm, goals: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="What do you want to achieve through this mentorship?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Focus Areas</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        const current = requestForm.focusAreas;
                        setRequestForm({
                          ...requestForm,
                          focusAreas: current.includes(area) ? current.filter(a => a !== area) : [...current, area],
                        });
                      }}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        requestForm.focusAreas.includes(area)
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {EXPERTISE_LABELS[area]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowRequestModal(false); setSelectedMentor(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestMentorship}
                disabled={!requestForm.goals}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
