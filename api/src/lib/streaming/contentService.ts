/**
 * Streaming & Content Module
 * Educational content, live streams, and content management
 */

export interface ContentItem {
  id: string;
  type: 'article' | 'video' | 'podcast' | 'webinar' | 'course';
  title: string;
  description: string;
  author: ContentAuthor;
  category: ContentCategory;
  tags: string[];
  thumbnail?: string;
  duration?: number; // minutes for video/podcast
  readTime?: number; // minutes for articles
  publishedAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  premium: boolean;
  views: number;
  likes: number;
  rating: number;
  ratingCount: number;
}

export interface ContentAuthor {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  bio?: string;
  expertise: string[];
}

export type ContentCategory =
  | 'investing_basics'
  | 'real_estate_fundamentals'
  | 'market_analysis'
  | 'tax_strategies'
  | 'property_management'
  | 'risk_management'
  | 'advanced_strategies'
  | 'success_stories'
  | 'news_updates';

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  host: ContentAuthor;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  streamUrl?: string;
  chatEnabled: boolean;
  viewerCount: number;
  maxViewers: number;
  recordingUrl?: string;
  topics: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: ContentAuthor;
  modules: CourseModule[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  enrollmentCount: number;
  completionRate: number;
  rating: number;
  price: number; // 0 for free
  certificate: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  quiz?: Quiz;
  order: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'interactive';
  duration: number;
  content: string; // URL or content ID
  order: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserProgress {
  userId: string;
  contentId: string;
  type: 'content' | 'course';
  progress: number; // 0-100
  completedAt?: Date;
  lastAccessedAt: Date;
  notes?: string;
  bookmarked: boolean;
}

// Sample content library
const CONTENT_LIBRARY: ContentItem[] = [
  {
    id: 'content-1',
    type: 'article',
    title: 'Getting Started with Real Estate Investing',
    description: 'A comprehensive guide for beginners looking to enter the real estate market.',
    author: {
      id: 'author-1',
      name: 'Sarah Chen',
      title: 'Real Estate Investment Analyst',
      expertise: ['market analysis', 'portfolio management'],
    },
    category: 'investing_basics',
    tags: ['beginner', 'fundamentals', 'getting-started'],
    readTime: 15,
    publishedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    status: 'published',
    premium: false,
    views: 12450,
    likes: 890,
    rating: 4.8,
    ratingCount: 234,
  },
  {
    id: 'content-2',
    type: 'video',
    title: 'Understanding Cap Rates and ROI',
    description: 'Learn how to calculate and interpret key real estate investment metrics.',
    author: {
      id: 'author-2',
      name: 'Michael Torres',
      title: 'Senior Investment Strategist',
      expertise: ['financial analysis', 'valuation'],
    },
    category: 'real_estate_fundamentals',
    tags: ['metrics', 'analysis', 'ROI', 'cap-rate'],
    duration: 25,
    publishedAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    status: 'published',
    premium: false,
    views: 8920,
    likes: 654,
    rating: 4.9,
    ratingCount: 178,
  },
  {
    id: 'content-3',
    type: 'webinar',
    title: 'Tax Strategies for Real Estate Investors',
    description: 'Expert panel discussion on maximizing tax benefits from real estate investments.',
    author: {
      id: 'author-3',
      name: 'Jennifer Williams, CPA',
      title: 'Tax Strategy Director',
      expertise: ['tax planning', '1031 exchanges', 'depreciation'],
    },
    category: 'tax_strategies',
    tags: ['taxes', 'strategy', 'deductions', 'K-1'],
    duration: 60,
    publishedAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    status: 'published',
    premium: true,
    views: 5670,
    likes: 423,
    rating: 4.7,
    ratingCount: 98,
  },
];

/**
 * Get content by ID
 */
export function getContentById(contentId: string): ContentItem | null {
  return CONTENT_LIBRARY.find((c) => c.id === contentId) || null;
}

/**
 * Search and filter content
 */
export function searchContent(
  options: {
    query?: string;
    category?: ContentCategory;
    type?: ContentItem['type'];
    premium?: boolean;
    tags?: string[];
    sortBy?: 'recent' | 'popular' | 'rating';
    limit?: number;
    offset?: number;
  }
): {
  items: ContentItem[];
  total: number;
  hasMore: boolean;
} {
  let results = [...CONTENT_LIBRARY];

  // Filter by query
  if (options.query) {
    const query = options.query.toLowerCase();
    results = results.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Filter by category
  if (options.category) {
    results = results.filter((c) => c.category === options.category);
  }

  // Filter by type
  if (options.type) {
    results = results.filter((c) => c.type === options.type);
  }

  // Filter by premium
  if (options.premium !== undefined) {
    results = results.filter((c) => c.premium === options.premium);
  }

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    results = results.filter((c) =>
      options.tags!.some((tag) => c.tags.includes(tag))
    );
  }

  // Sort
  switch (options.sortBy) {
    case 'recent':
      results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      break;
    case 'popular':
      results.sort((a, b) => b.views - a.views);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
  }

  const total = results.length;
  const offset = options.offset || 0;
  const limit = options.limit || 10;

  return {
    items: results.slice(offset, offset + limit),
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Get recommended content for user
 */
export function getRecommendedContent(
  userId: string,
  userInterests: string[],
  limit: number = 5
): ContentItem[] {
  // Simple recommendation based on interests
  let recommended = CONTENT_LIBRARY.filter((c) =>
    c.tags.some((tag) => userInterests.includes(tag)) ||
    userInterests.includes(c.category)
  );

  // If not enough matches, add popular content
  if (recommended.length < limit) {
    const popular = CONTENT_LIBRARY
      .filter((c) => !recommended.includes(c))
      .sort((a, b) => b.views - a.views);
    recommended = [...recommended, ...popular];
  }

  return recommended.slice(0, limit);
}

/**
 * Get upcoming live streams
 */
export function getUpcomingStreams(limit: number = 5): LiveStream[] {
  const now = new Date();

  // Mock upcoming streams
  const streams: LiveStream[] = [
    {
      id: 'stream-1',
      title: 'Monthly Market Update - March 2024',
      description: 'Live analysis of current real estate market trends and investment opportunities.',
      host: CONTENT_LIBRARY[1].author,
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      chatEnabled: true,
      viewerCount: 0,
      maxViewers: 500,
      topics: ['market analysis', 'trends', 'opportunities'],
    },
    {
      id: 'stream-2',
      title: 'Q&A: Tax Season Preparation',
      description: 'Get your tax questions answered live by our expert panel.',
      host: CONTENT_LIBRARY[2].author,
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      chatEnabled: true,
      viewerCount: 0,
      maxViewers: 300,
      topics: ['taxes', 'K-1', 'deductions'],
    },
  ];

  return streams.slice(0, limit);
}

/**
 * Get course catalog
 */
export function getCourseCatalog(): Course[] {
  return [
    {
      id: 'course-1',
      title: 'Real Estate Investing 101',
      description: 'A complete introduction to real estate investing for beginners.',
      instructor: CONTENT_LIBRARY[0].author,
      modules: [
        {
          id: 'mod-1-1',
          title: 'Introduction to Real Estate Investing',
          description: 'Understanding the basics of real estate as an asset class.',
          lessons: [
            { id: 'les-1', title: 'Why Real Estate?', type: 'video', duration: 10, content: 'video-url-1', order: 1 },
            { id: 'les-2', title: 'Types of Real Estate Investments', type: 'video', duration: 15, content: 'video-url-2', order: 2 },
            { id: 'les-3', title: 'Getting Started Checklist', type: 'article', duration: 5, content: 'article-url-1', order: 3 },
          ],
          order: 1,
        },
        {
          id: 'mod-1-2',
          title: 'Understanding the Numbers',
          description: 'Key metrics and calculations for evaluating investments.',
          lessons: [
            { id: 'les-4', title: 'Cap Rate Explained', type: 'video', duration: 12, content: 'video-url-3', order: 1 },
            { id: 'les-5', title: 'Cash-on-Cash Return', type: 'video', duration: 10, content: 'video-url-4', order: 2 },
            { id: 'les-6', title: 'Interactive Calculator', type: 'interactive', duration: 15, content: 'calc-url-1', order: 3 },
          ],
          quiz: {
            id: 'quiz-1',
            title: 'Module 2 Quiz',
            questions: [
              {
                id: 'q1',
                question: 'What does a higher cap rate indicate?',
                options: ['Lower risk', 'Higher risk', 'No relationship to risk', 'Better location'],
                correctAnswer: 1,
                explanation: 'Higher cap rates typically indicate higher risk, but also potentially higher returns.',
              },
            ],
            passingScore: 70,
          },
          order: 2,
        },
      ],
      totalDuration: 67,
      difficulty: 'beginner',
      prerequisites: [],
      enrollmentCount: 3450,
      completionRate: 78,
      rating: 4.8,
      price: 0,
      certificate: true,
    },
  ];
}

/**
 * Track content view/engagement
 */
export async function trackEngagement(
  userId: string,
  contentId: string,
  action: 'view' | 'like' | 'complete' | 'share'
): Promise<void> {
  // Would track in database/analytics
  console.log(`Tracked: User ${userId} ${action} content ${contentId}`);
}

/**
 * Update user progress
 */
export async function updateProgress(
  userId: string,
  contentId: string,
  progress: number,
  type: 'content' | 'course' = 'content'
): Promise<UserProgress> {
  return {
    userId,
    contentId,
    type,
    progress: Math.min(100, Math.max(0, progress)),
    completedAt: progress >= 100 ? new Date() : undefined,
    lastAccessedAt: new Date(),
    bookmarked: false,
  };
}

/**
 * Get user's content progress
 */
export async function getUserProgress(
  userId: string,
  contentIds?: string[]
): Promise<UserProgress[]> {
  // Mock progress data
  return [
    {
      userId,
      contentId: 'content-1',
      type: 'content',
      progress: 100,
      completedAt: new Date('2024-01-20'),
      lastAccessedAt: new Date('2024-01-20'),
      bookmarked: true,
    },
    {
      userId,
      contentId: 'course-1',
      type: 'course',
      progress: 45,
      lastAccessedAt: new Date('2024-02-01'),
      bookmarked: false,
    },
  ];
}
