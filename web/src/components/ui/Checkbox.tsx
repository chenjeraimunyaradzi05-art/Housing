'use client';

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const labelSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, size = 'md', id, disabled, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${checkboxId}-error` : description ? `${checkboxId}-description` : undefined}
            className={cn(
              'rounded border-gray-300 text-rose-500 transition-colors',
              'focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:border-gray-600 dark:bg-gray-900 dark:checked:bg-rose-500',
              sizeStyles[size],
              error && 'border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'font-medium cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed',
                  error ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100',
                  labelSizeStyles[size]
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${checkboxId}-description`}
                className={cn(
                  'text-gray-500 dark:text-gray-400',
                  size === 'sm' ? 'text-xs' : 'text-sm'
                )}
              >
                {description}
              </p>
            )}
            {error && (
              <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
