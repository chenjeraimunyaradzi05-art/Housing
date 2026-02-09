'use client';

import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  default: 'bg-rose-500 dark:bg-rose-400',
  success: 'bg-teal-500 dark:bg-teal-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-red-500 dark:bg-red-400',
};

/**
 * Progress bar component for showing completion status
 */
export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
  animated = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || 'Progress'}
          </span>
          {showLabel && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${Math.round(percentage)}% complete`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantStyles[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Circular progress indicator
 */
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

const circularVariantStyles = {
  default: 'stroke-rose-500 dark:stroke-rose-400',
  success: 'stroke-teal-500 dark:stroke-teal-400',
  warning: 'stroke-amber-500 dark:stroke-amber-400',
  danger: 'stroke-red-500 dark:stroke-red-400',
};

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = false,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-all duration-500 ease-out',
            circularVariantStyles[variant]
          )}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold text-gray-700 dark:text-gray-300">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/**
 * Steps progress indicator
 */
export interface StepsProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
}

export function StepsProgress({
  currentStep,
  totalSteps,
  labels,
  className,
}: StepsProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step circle */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                index < currentStep
                  ? 'bg-rose-500 text-white'
                  : index === currentStep
                    ? 'bg-rose-500 text-white ring-4 ring-rose-100 dark:ring-rose-900'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {index < currentStep ? (
                <svg className="w-4 h-4\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
                  <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 rounded-full transition-colors',
                  index < currentStep
                    ? 'bg-rose-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>
      {labels && labels.length > 0 && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <span
              key={index}
              className={cn(
                'text-xs text-center',
                index <= currentStep
                  ? 'text-gray-700 dark:text-gray-300 font-medium'
                  : 'text-gray-400 dark:text-gray-500'
              )}
              style={{ width: index === 0 || index === labels.length - 1 ? 'auto' : '100%' }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
