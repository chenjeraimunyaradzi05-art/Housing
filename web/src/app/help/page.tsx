'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  { category: 'getting_started', question: 'How do I create an account?', answer: 'Click "Sign Up" on the homepage, enter your email and create a password. You\'ll receive a verification email to confirm your account. Once verified, complete the onboarding questionnaire to personalize your experience.' },
  { category: 'getting_started', question: 'Is VÖR free to use?', answer: 'VÖR offers a free tier with access to basic features including property browsing, community forums, and financial tracking. Premium features like AI-powered valuations, advanced tax tools, and co-investment pools may require a subscription.' },
  { category: 'getting_started', question: 'How do I navigate the platform?', answer: 'Use the sidebar navigation on the left to access different modules. The main sections include Dashboard, Properties, Investments, Co-Invest, Community, and various tools like AI Assistant, Tax & Accounting, and Safe Housing.' },
  { category: 'investments', question: 'How does co-investing work?', answer: 'Co-investing allows multiple investors to pool their resources to purchase properties together. Browse available pools, review the property details and projected returns, then invest your desired amount. Returns are distributed proportionally based on your ownership percentage.' },
  { category: 'investments', question: 'What are the minimum investment amounts?', answer: 'Minimum investments vary by pool but typically start at $1,000 for co-investment pools. Individual property investments depend on the property price and financing options available.' },
  { category: 'investments', question: 'How are returns calculated and distributed?', answer: 'Returns include rental income distributions (monthly or quarterly) and capital appreciation upon property sale. K-1 tax documents are generated annually for each co-investment pool you participate in.' },
  { category: 'financial', question: 'How do I connect my bank accounts?', answer: 'Navigate to Dashboard > Finances > Accounts and click "Link Account." We use Plaid for secure bank connections. Your credentials are never stored on our servers — Plaid handles all authentication securely.' },
  { category: 'financial', question: 'How does the AI categorize my transactions?', answer: 'Our AI engine automatically categorizes transactions based on merchant data and spending patterns. You can correct any miscategorizations, and the AI learns from your corrections to improve accuracy over time.' },
  { category: 'financial', question: 'How do tax deductions work?', answer: 'Navigate to Tax & Accounting > Deductions to track tax-deductible expenses related to your properties. The platform automatically identifies common deductions like mortgage interest, property taxes, depreciation, repairs, and insurance.' },
  { category: 'safe_housing', question: 'What is the Safe Housing module?', answer: 'Safe Housing provides confidential resources for women seeking safe living situations. It includes a verified housing directory, crisis hotlines, legal resources, financial assistance programs, and a personal safety planning tool. Your activity in this section is kept private.' },
  { category: 'safe_housing', question: 'Is my activity in Safe Housing private?', answer: 'Yes. We take extra precautions with the Safe Housing module. Activity is not logged in your general account history, and the section can be accessed discreetly. We also provide guidance on safe browsing practices.' },
  { category: 'agents', question: 'How do I find a real estate agent?', answer: 'Visit the Agents section to browse our verified network of women-led and women-supporting real estate professionals. Filter by specialization, region, and ratings. You can contact agents directly through the platform.' },
  { category: 'agents', question: 'How do I become a VÖR agent?', answer: 'Navigate to Agents > Become an Agent and fill out the application form with your license information, specializations, and bio. Our team will review and verify your credentials within 3-5 business days.' },
  { category: 'account', question: 'How do I update my profile?', answer: 'Go to Dashboard > Profile to update your personal information, profile picture, and bio. For account settings like email, password, and notifications, visit Dashboard > Settings.' },
  { category: 'account', question: 'How do I delete my account?', answer: 'Go to Settings > Account > Delete Account. You\'ll have a 30-day grace period during which you can cancel the deletion. After 30 days, all your data will be permanently removed in compliance with our data retention policy.' },
];

const CATEGORIES = [
  { key: 'all', label: 'All Topics', icon: '📋' },
  { key: 'getting_started', label: 'Getting Started', icon: '🚀' },
  { key: 'investments', label: 'Investments', icon: '💰' },
  { key: 'financial', label: 'Financial Tools', icon: '🏦' },
  { key: 'safe_housing', label: 'Safe Housing', icon: '🛡️' },
  { key: 'agents', label: 'Agents', icon: '👩‍💼' },
  { key: 'account', label: 'Account', icon: '👤' },
];

const GUIDES = [
  { title: 'Getting Started with VÖR', desc: 'A complete walkthrough of the platform', icon: '🚀', href: '#' },
  { title: 'Your First Investment', desc: 'Step-by-step guide to making your first property investment', icon: '🏠', href: '#' },
  { title: 'Co-Investing 101', desc: 'Everything you need to know about pooling resources', icon: '👩‍👩‍👧', href: '#' },
  { title: 'Tax Optimization Guide', desc: 'Maximize deductions and minimize your tax burden', icon: '🧮', href: '#' },
  { title: 'Using AI Tools', desc: 'Get the most out of AI valuations and insights', icon: '🤖', href: '#' },
  { title: 'Community Guidelines', desc: 'How to engage positively in the VÖR community', icon: '💬', href: '#' },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = FAQ_ITEMS.filter(faq => {
    if (activeCategory !== 'all' && faq.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-rose-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-lg opacity-90 mb-8">Search our knowledge base or browse topics below</p>
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-xl text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12 -mt-8 relative z-10">
          {[
            { label: 'Contact Support', icon: '📧', action: 'mailto:support@vor-platform.com' },
            { label: 'Report a Bug', icon: '🐛', action: '#' },
            { label: 'Feature Request', icon: '💡', action: '#' },
            { label: 'Status Page', icon: '🟢', action: '#' },
          ].map((link, i) => (
            <a key={i} href={link.action} className="block">
              <Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <span className="text-2xl block mb-1">{link.icon}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{link.label}</p>
              </Card>
            </a>
          ))}
        </div>

        {/* Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Guides & Tutorials</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((guide, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <span className="text-3xl block mb-3">{guide.icon}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{guide.title}</h3>
                <p className="text-sm text-gray-500">{guide.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No results found. Try a different search term or category.</p>
              </Card>
            ) : (
              filteredFAQs.map((faq, i) => (
                <Card key={i} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedFAQ === i ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFAQ === i && (
                    <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12">
          <Card className="p-8 text-center bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-900/20 dark:to-purple-900/20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Still need help?</h2>
            <p className="text-gray-500 mb-6">Our support team is here to help you succeed.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>Email Support</Button>
              <Button variant="outline">Schedule a Call</Button>
              <Link href="/dashboard/community">
                <Button variant="outline">Ask the Community</Button>
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">Average response time: under 24 hours</p>
          </Card>
        </section>
      </div>
    </div>
  );
}
