'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';

interface OnboardingData {
  investmentExperience: string;
  investmentGoals: string[];
  propertyInterests: string[];
  budgetRange: string;
  timeframe: string;
  location: string;
  interests: string[];
}

const STEPS = [
  { title: 'Welcome', subtitle: 'Let\'s personalize your experience' },
  { title: 'Experience', subtitle: 'Tell us about your investment background' },
  { title: 'Goals', subtitle: 'What do you want to achieve?' },
  { title: 'Preferences', subtitle: 'Help us match you with the right opportunities' },
  { title: 'Get Started', subtitle: 'You\'re all set!' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    investmentExperience: '',
    investmentGoals: [],
    propertyInterests: [],
    budgetRange: '',
    timeframe: '',
    location: '',
    interests: [],
  });

  function toggleArrayItem(field: keyof OnboardingData, value: string) {
    setData(prev => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function complete() {
    try {
      await fetch('/api/users/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      // Continue even if save fails
    }
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= step ? 'bg-rose-500 w-12' : 'bg-gray-300 dark:bg-gray-600 w-8'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="p-8 text-center">
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome to VÖR
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Your journey to financial empowerment starts here.
            </p>
            <p className="text-gray-500 mb-8">
              Let&apos;s take 2 minutes to personalize your experience so we can help you reach your goals faster.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              {[
                { icon: '🏠', title: 'Real Estate', desc: 'Browse and invest in properties' },
                { icon: '👩‍👩‍👧‍👦', title: 'Community', desc: 'Connect with like-minded women' },
                { icon: '💰', title: 'Financial Tools', desc: 'Track wealth and optimize taxes' },
                { icon: '🤖', title: 'AI Insights', desc: 'Smart recommendations for you' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={next}>Let&apos;s Get Started</Button>
            <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600 mt-4 block mx-auto">
              Skip for now
            </button>
          </Card>
        )}

        {/* Step 1: Experience */}
        {step === 1 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{STEPS[1].title}</h2>
            <p className="text-gray-500 mb-6">{STEPS[1].subtitle}</p>

            <div className="space-y-3">
              {[
                { value: 'none', label: 'Brand New', desc: 'I\'ve never invested in real estate' },
                { value: 'beginner', label: 'Beginner', desc: 'I own my home or have done some research' },
                { value: 'intermediate', label: 'Intermediate', desc: 'I own 1-3 investment properties' },
                { value: 'advanced', label: 'Advanced', desc: 'I actively manage a real estate portfolio' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setData(p => ({ ...p, investmentExperience: option.value }))}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    data.investmentExperience === option.value
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                  <p className="text-sm text-gray-500">{option.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button onClick={next} disabled={!data.investmentExperience}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{STEPS[2].title}</h2>
            <p className="text-gray-500 mb-6">{STEPS[2].subtitle} (select all that apply)</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'first_home', label: 'Buy my first home', icon: '🏡' },
                { value: 'rental_income', label: 'Earn rental income', icon: '💵' },
                { value: 'wealth_building', label: 'Build generational wealth', icon: '📈' },
                { value: 'co_investing', label: 'Co-invest with other women', icon: '👩‍👩‍👧' },
                { value: 'financial_freedom', label: 'Financial independence', icon: '🦋' },
                { value: 'safe_housing', label: 'Find safe housing', icon: '🛡️' },
                { value: 'tax_optimization', label: 'Optimize taxes', icon: '🧮' },
                { value: 'learn', label: 'Learn about real estate', icon: '📚' },
              ].map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => toggleArrayItem('investmentGoals', goal.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    data.investmentGoals.includes(goal.value)
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{goal.icon}</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{goal.label}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button onClick={next} disabled={data.investmentGoals.length === 0}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{STEPS[3].title}</h2>
            <p className="text-gray-500 mb-6">{STEPS[3].subtitle}</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'under_50k', label: 'Under $50K' },
                    { value: '50k_150k', label: '$50K - $150K' },
                    { value: '150k_500k', label: '$150K - $500K' },
                    { value: 'over_500k', label: 'Over $500K' },
                  ].map((budget) => (
                    <button
                      key={budget.value}
                      onClick={() => setData(p => ({ ...p, budgetRange: budget.value }))}
                      className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                        data.budgetRange === budget.value
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {budget.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Investment Timeframe</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'asap', label: 'ASAP' },
                    { value: '6_months', label: '6 months' },
                    { value: '1_year', label: '1+ year' },
                  ].map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setData(p => ({ ...p, timeframe: tf.value }))}
                      className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                        data.timeframe === tf.value
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Location</label>
                <input
                  type="text"
                  placeholder="City, State (e.g., Austin, TX)"
                  value={data.location}
                  onChange={(e) => setData(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button onClick={next}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re All Set!</h2>
            <p className="text-gray-500 mb-8">
              We&apos;ve customized your VÖR experience based on your preferences. You can always update these in Settings.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Your Personalized Experience</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {data.investmentGoals.includes('first_home') && <li>✓ First-time homebuyer resources and guides</li>}
                {data.investmentGoals.includes('rental_income') && <li>✓ Rental property listings and income projections</li>}
                {data.investmentGoals.includes('co_investing') && <li>✓ Co-investment pools matched to your budget</li>}
                {data.investmentGoals.includes('wealth_building') && <li>✓ Long-term wealth building strategies</li>}
                {data.investmentGoals.includes('safe_housing') && <li>✓ Safe housing directory and support resources</li>}
                {data.investmentGoals.includes('tax_optimization') && <li>✓ Tax optimization tools and deduction tracking</li>}
                {data.investmentGoals.includes('learn') && <li>✓ Educational content tailored to your level</li>}
                {data.investmentGoals.includes('financial_freedom') && <li>✓ Financial independence planning tools</li>}
                <li>✓ AI-powered investment recommendations</li>
                <li>✓ Community access with like-minded women</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button onClick={complete}>Go to Dashboard</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
