'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Spinner } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error?.message || 'Failed to verify email');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  if (status === 'loading') {
    return (
      <Card className="p-8 text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Verifying your email...
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please wait while we verify your email address.
        </p>
      </Card>
    );
  }

  if (status === 'no-token') {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Verification Token
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No verification token was provided. Please check your email for the verification link.
        </p>
        <Link href="/login">
          <Button variant="outline">Go to login</Button>
        </Link>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Verification Failed
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The link may have expired or already been used.
          </p>
          <Link href="/login">
            <Button variant="primary">Go to login</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Email Verified! 🎉
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Your account is now fully activated. You can explore all VÖR features.
      </p>
      <Link href="/dashboard">
        <Button variant="primary">Go to Dashboard</Button>
      </Link>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              VÖR
            </h1>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Email Verification
          </h2>
        </div>

        <Suspense fallback={
          <Card className="p-8 text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Loading...
            </h3>
          </Card>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
