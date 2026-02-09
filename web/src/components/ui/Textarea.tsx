'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharCount,
      maxLength,
      id,
      required,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium mb-1.5',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={cn(
            'block w-full rounded-lg border bg-white transition-all duration-200 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            'dark:bg-gray-900 dark:disabled:bg-gray-800',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'px-4 py-3 text-gray-900 dark:text-gray-100 min-h-[100px]',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400'
              : 'border-gray-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-gray-700 dark:focus:border-rose-400',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center mt-1.5">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {helperText && !error && (
              <p id={`${textareaId}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
                {helperText}
              </p>
            )}
          </div>
          {showCharCount && maxLength && (
            <span
              className={cn(
                'text-xs',
                charCount >= maxLength
                  ? 'text-red-500'
                  : charCount >= maxLength * 0.9
                  ? 'text-yellow-500'
                  : 'text-gray-400'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
