import Link from "next/link";

const STATS = [
  { value: '12,000+', label: 'Women Investors' },
  { value: '$240M+', label: 'Total Invested' },
  { value: '850+', label: 'Properties Funded' },
  { value: '97%', label: 'Satisfaction Rate' },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Co-Invest Together',
    desc: 'Pool resources with other women investors to access larger real estate opportunities starting at $1,000.',
    color: 'rose',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Financial Tools',
    desc: 'Integrated accounting, tax planning, budgeting, and AI-powered insights for smarter decisions.',
    color: 'purple',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Women&apos;s Community',
    desc: 'Connect with mentors, share knowledge, and grow together in a supportive, women-first environment.',
    color: 'teal',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Powered Insights',
    desc: 'Smart property valuations, market analysis, and personalized investment recommendations.',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Safe Housing',
    desc: 'Confidential resources for women seeking safe living situations, with crisis support and privacy tools.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: 'Learn & Grow',
    desc: 'Educational courses, live webinars, expert mentorship, and content to accelerate your journey.',
    color: 'indigo',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up free and complete your personalized onboarding in under 2 minutes.' },
  { step: '02', title: 'Set Your Goals', desc: 'Tell us about your investment goals, budget, and timeline. Our AI customizes your experience.' },
  { step: '03', title: 'Explore Opportunities', desc: 'Browse properties, co-investment pools, and educational resources tailored to you.' },
  { step: '04', title: 'Invest & Grow', desc: 'Start investing with as little as $1,000. Track your portfolio and watch your wealth grow.' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'First-Time Investor', quote: 'VÖR made real estate investing accessible for me. I co-invested in my first property with just $2,500 and earned 12% returns in my first year.', avatar: 'SM' },
  { name: 'Priya K.', role: 'Portfolio Investor', quote: 'The financial tools and AI insights helped me optimize my tax strategy and save over $8,000 last year. The community support is incredible.', avatar: 'PK' },
  { name: 'Michelle T.', role: 'Real Estate Agent', quote: 'As an agent on VÖR, I\'ve connected with amazing women clients. The platform\'s lead management and referral system doubled my business.', avatar: 'MT' },
];

const PRICING = [
  { name: 'Free', price: '$0', period: '/forever', desc: 'Perfect for getting started', features: ['Browse properties', 'Community access', 'Basic financial tracking', 'Educational content', 'Up to 2 saved searches'], cta: 'Get Started Free', highlighted: false },
  { name: 'Investor', price: '$19', period: '/month', desc: 'For active investors', features: ['Everything in Free', 'Co-investment pools', 'AI property valuations', 'Tax optimization tools', 'Unlimited saved searches', 'Priority support', 'Mentorship matching'], cta: 'Start Investing', highlighted: true },
  { name: 'Pro', price: '$49', period: '/month', desc: 'For serious portfolio builders', features: ['Everything in Investor', 'Advanced analytics', 'Agent network access', 'Custom reports & K-1s', 'API access', 'Dedicated advisor', 'White-glove onboarding'], cta: 'Go Pro', highlighted: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <span className="text-3xl font-bold text-rose-600">VÖR</span>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                <a href="#features" className="hover:text-rose-600 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-rose-600 transition-colors">How It Works</a>
                <a href="#pricing" className="hover:text-rose-600 transition-colors">Pricing</a>
                <Link href="/help" className="hover:text-rose-600 transition-colors">Help</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-700 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 transition-colors font-medium text-sm">
                Sign In
              </Link>
              <Link href="/register" className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-colors">
                Get Started Free
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-purple-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
        <div className="relative container mx-auto px-4 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              Trusted by 12,000+ women investors
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Build <span className="text-rose-600">Generational Wealth</span> Through Real Estate
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform where women co-invest in real estate, access AI-powered financial tools, and build wealth together — starting with as little as $1,000.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/register" className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-rose-600/25">
                Start Investing Today
              </Link>
              <Link href="#how-it-works" className="border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-rose-600 hover:text-rose-600 px-8 py-4 rounded-full font-semibold text-lg transition-colors">
                See How It Works
              </Link>
            </div>
            <p className="text-sm text-gray-400">No credit card required. Free forever plan available.</p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-16 z-10">
        <div className="container mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-rose-600">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need to Build Wealth</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">A complete ecosystem designed by women, for women — combining real estate investing, financial tools, and community support.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <div key={i} className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-rose-200 dark:hover:border-rose-800 transition-all">
              <div className={`w-14 h-14 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-xl flex items-center justify-center mb-5 text-${feature.color}-600 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Start building wealth in four simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-rose-200 dark:bg-rose-800" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Loved by Women Investors</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Hear from members who are building their wealth with VÖR</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Start free and upgrade as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <div key={i} className={`relative bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 ${plan.highlighted ? 'border-rose-600 shadow-xl shadow-rose-600/10' : 'border-gray-100 dark:border-gray-700'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                <div className="my-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-3 rounded-full font-semibold transition-colors ${plan.highlighted ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Built With Trust & Security</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Your security and privacy are our top priorities</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {[
            { icon: '🔒', label: '256-bit Encryption' },
            { icon: '🛡️', label: 'SOC 2 Compliant' },
            { icon: '🏦', label: 'FDIC Insured Partners' },
            { icon: '👁️', label: 'GDPR & Privacy First' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-4xl">{item.icon}</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-rose-600 to-purple-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Building Wealth?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">Join thousands of women who are taking control of their financial futures through real estate investing.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-rose-600 hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg transition-colors">
              Create Free Account
            </Link>
            <Link href="/help" className="border-2 border-white/50 text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-colors">
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-bold text-rose-500">VÖR</span>
              <p className="text-sm mt-3 leading-relaxed">Empowering women through real estate investing and generational wealth building.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-rose-400 transition-colors">Get Started</Link></li>
                <li><Link href="/invest" className="hover:text-rose-400 transition-colors">Browse Properties</Link></li>
                <li><Link href="/dashboard/learn" className="hover:text-rose-400 transition-colors">Learn</Link></li>
                <li><Link href="/dashboard/community" className="hover:text-rose-400 transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard/calculator" className="hover:text-rose-400 transition-colors">Mortgage Calculator</Link></li>
                <li><Link href="/dashboard/ai" className="hover:text-rose-400 transition-colors">AI Valuations</Link></li>
                <li><Link href="/dashboard/tax" className="hover:text-rose-400 transition-colors">Tax Planning</Link></li>
                <li><Link href="/dashboard/finances" className="hover:text-rose-400 transition-colors">Financial Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-rose-400 transition-colors">Help Center</Link></li>
                <li><Link href="/dashboard/safe-housing" className="hover:text-rose-400 transition-colors">Safe Housing</Link></li>
                <li><Link href="/dashboard/agents" className="hover:text-rose-400 transition-colors">Find an Agent</Link></li>
                <li><a href="mailto:support@vor-platform.com" className="hover:text-rose-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-rose-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Disclosures</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; 2026 VÖR Platform, Inc. All rights reserved.</p>
            <p className="text-xs text-gray-500 max-w-lg text-center md:text-right">
              Investment involves risk. Past performance does not guarantee future results. VÖR is not a registered broker-dealer or investment adviser. Please consult with qualified professionals before making investment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
