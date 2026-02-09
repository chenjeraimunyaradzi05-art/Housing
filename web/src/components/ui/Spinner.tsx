'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'current';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-4 w-4 border-2',
      md: 'h-6 w-6 border-2',
      lg: 'h-8 w-8 border-[3px]',
      xl: 'h-12 w-12 border-4',
    };

    const colorStyles = {
      primary: 'border-gray-200 border-t-rose-500 dark:border-gray-700 dark:border-t-rose-400',
      secondary: 'border-gray-200 border-t-lavender-500 dark:border-gray-700 dark:border-t-lavender-400',
      white: 'border-white/30 border-t-white',
      current: 'border-current/30 border-t-current',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-spin rounded-full',
          sizeStyles[size],
          colorStyles[color],
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, text = 'Loading...', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center gap-3', className)}
        {...props}
      >
        <Spinner size={size} />
        {text && <span className="text-sm text-gray-500 dark:text-gray-400">{text}</span>}
      </div>
    );
  }
);
Loading.displayName = 'Loading';
