'use client';

import { useState, useEffect } from 'react';
import { Card, Spinner, Button } from '@/components/ui';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  thumbnailUrl: string | null;
  duration: number | null;
  creatorName: string;
  tags: string[];
  difficulty: string;
  isPremium: boolean;
  viewCount: number;
  likeCount: number;
  avgRating: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: number;
  duration: string;
  difficulty: string;
  enrolled: number;
  rating: number;
  isPremium: boolean;
}

interface UpcomingStream {
  id: string;
  title: string;
  hostName: string;
  scheduledAt: string;
  duration: number;
  category: string;
  attendees: number;
}

const MOCK_CONTENT: ContentItem[] = [
  { id: '1', title: 'Real Estate Investing 101: Getting Started', description: 'Learn the fundamentals of real estate investing for beginners.', type: 'video', category: 'investing', thumbnailUrl: null, duration: 1800, creatorName: 'Sarah Chen', tags: ['beginner', 'investing'], difficulty: 'beginner', isPremium: false, viewCount: 12450, likeCount: 892, avgRating: 4.8 },
  { id: '2', title: 'Understanding Mortgage Rates in 2026', description: 'A comprehensive guide to mortgage rates and how they affect your buying power.', type: 'article', category: 'finance', thumbnailUrl: null, duration: null, creatorName: 'Maria Rodriguez', tags: ['mortgage', 'rates'], difficulty: 'beginner', isPremium: false, viewCount: 8930, likeCount: 645, avgRating: 4.6 },
  { id: '3', title: 'Co-Investing: Building Wealth Together', description: 'How women are pooling resources to invest in real estate collectively.', type: 'video', category: 'investing', thumbnailUrl: null, duration: 2400, creatorName: 'Aisha Johnson', tags: ['co-investing', 'community'], difficulty: 'intermediate', isPremium: false, viewCount: 6780, likeCount: 512, avgRating: 4.9 },
  { id: '4', title: 'Tax Strategies for Real Estate Investors', description: 'Advanced tax optimization strategies for property owners.', type: 'video', category: 'finance', thumbnailUrl: null, duration: 3600, creatorName: 'Emily Park', tags: ['tax', 'advanced'], difficulty: 'advanced', isPremium: true, viewCount: 4560, likeCount: 389, avgRating: 4.7 },
  { id: '5', title: 'Market Analysis: Where to Invest in 2026', description: 'Data-driven analysis of the best real estate markets for investment.', type: 'article', category: 'market_analysis', thumbnailUrl: null, duration: null, creatorName: 'Dr. Lisa Wang', tags: ['market', 'analysis', 'data'], difficulty: 'intermediate', isPremium: true, viewCount: 5670, likeCount: 423, avgRating: 4.8 },
  { id: '6', title: 'Financial Independence Through Real Estate', description: 'A podcast discussion on achieving financial freedom with property investing.', type: 'podcast', category: 'lifestyle', thumbnailUrl: null, duration: 2700, creatorName: 'VÖR Podcast Team', tags: ['podcast', 'financial_freedom'], difficulty: 'beginner', isPremium: false, viewCount: 9870, likeCount: 734, avgRating: 4.5 },
];

const MOCK_COURSES: Course[] = [
  { id: '1', title: 'Real Estate Investing Masterclass', description: 'Complete guide from beginner to confident investor', modules: 12, duration: '8 hours', difficulty: 'beginner', enrolled: 2340, rating: 4.9, isPremium: false },
  { id: '2', title: 'Property Valuation & Analysis', description: 'Learn to evaluate properties like a professional', modules: 8, duration: '5 hours', difficulty: 'intermediate', enrolled: 1560, rating: 4.8, isPremium: true },
  { id: '3', title: 'Tax Optimization for Investors', description: 'Maximize deductions and minimize tax liability', modules: 6, duration: '4 hours', difficulty: 'advanced', enrolled: 980, rating: 4.7, isPremium: true },
  { id: '4', title: 'First-Time Homebuyer Guide', description: 'Everything you need to know about buying your first home', modules: 10, duration: '6 hours', difficulty: 'beginner', enrolled: 3120, rating: 4.9, isPremium: false },
];

const MOCK_STREAMS: UpcomingStream[] = [
  { id: '1', title: 'Live Market Update: February 2026', hostName: 'Sarah Chen', scheduledAt: '2026-02-15T18:00:00Z', duration: 60, category: 'market_analysis', attendees: 234 },
  { id: '2', title: 'Q&A: First-Time Investor Questions', hostName: 'Aisha Johnson', scheduledAt: '2026-02-20T19:00:00Z', duration: 45, category: 'investing', attendees: 156 },
  { id: '3', title: 'Women in Real Estate: Panel Discussion', hostName: 'VÖR Team', scheduledAt: '2026-02-25T17:00:00Z', duration: 90, category: 'lifestyle', attendees: 412 },
];

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'courses' | 'live' | 'my-library'>('browse');
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [streams, setStreams] = useState<UpcomingStream[]>(MOCK_STREAMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const filteredContent = content.filter(c => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;
    return true;
  });

  const tabs = [
    { key: 'browse', label: 'Browse Content', icon: '📚' },
    { key: 'courses', label: 'Courses', icon: '🎓' },
    { key: 'live', label: 'Live & Upcoming', icon: '🔴' },
    { key: 'my-library', label: 'My Library', icon: '📖' },
  ] as const;

  const typeIcons: Record<string, string> = {
    video: '🎬',
    article: '📝',
    podcast: '🎙️',
    webinar: '📡',
    course: '🎓',
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learn & Grow</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Educational content, courses, and live events for real estate and financial literacy
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

      {/* Browse Content Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text" placeholder="Search content..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="article">Articles</option>
              <option value="podcast">Podcasts</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <option value="all">All Categories</option>
              <option value="investing">Investing</option>
              <option value="finance">Finance</option>
              <option value="market_analysis">Market Analysis</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="legal">Legal</option>
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Content Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContent.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/30 dark:to-purple-900/30 flex items-center justify-center relative">
                  <span className="text-4xl">{typeIcons[item.type] || '📄'}</span>
                  {item.isPremium && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">Premium</span>
                  )}
                  {item.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[item.difficulty] || ''}`}>
                      {item.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{item.category.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{item.creatorName}</span>
                    <div className="flex items-center gap-3">
                      <span>👁️ {item.viewCount.toLocaleString()}</span>
                      <span>⭐ {item.avgRating}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredContent.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-gray-500">Try adjusting your search or filters.</p>
            </Card>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Paths & Courses</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[course.difficulty] || ''}`}>
                      {course.difficulty}
                    </span>
                    {course.isPremium && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Premium</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    ⭐ {course.rating}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span>📚 {course.modules} modules</span>
                  <span>⏱️ {course.duration}</span>
                  <span>👥 {course.enrolled.toLocaleString()} enrolled</span>
                </div>
                <Button className="w-full">{course.isPremium ? 'Enroll (Premium)' : 'Start Course'}</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live & Upcoming Tab */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Live Events & Webinars</h2>
          {streams.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">🔴</p>
              <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
              <p className="text-gray-500">Check back soon for live events and webinars.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {streams.map((stream) => (
                <Card key={stream.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Upcoming</span>
                        <span className="text-xs text-gray-500">{stream.category.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{stream.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Hosted by {stream.hostName} • {stream.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(stream.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(stream.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{stream.attendees} registered</p>
                      <Button size="sm" className="mt-2">Register</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Library Tab */}
      {activeTab === 'my-library' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Library</h2>

          {/* Continue Watching */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Continue Watching</h3>
            <Card className="p-12 text-center">
              <p className="text-4xl mb-4">📖</p>
              <h3 className="text-lg font-semibold mb-2">No items in your library</h3>
              <p className="text-gray-500 mb-4">Start watching or reading content to build your library.</p>
              <Button variant="outline" onClick={() => setActiveTab('browse')}>Browse Content</Button>
            </Card>
          </div>

          {/* Bookmarks */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Bookmarked</h3>
            <Card className="p-8 text-center">
              <p className="text-gray-500">No bookmarks yet. Save content you want to revisit later.</p>
            </Card>
          </div>

          {/* Completed */}
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Completed</h3>
            <Card className="p-8 text-center">
              <p className="text-gray-500">Complete courses and content to see them here.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
