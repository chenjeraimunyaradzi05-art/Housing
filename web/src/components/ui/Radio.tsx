'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  error?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
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

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, size = 'md', id, disabled, ...props }, ref) => {
    const radioId = id || `${props.name}-${props.value}`;

    return (
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            disabled={disabled}
            className={cn(
              'border-gray-300 text-rose-500 transition-colors',
              'focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:border-gray-600 dark:bg-gray-900',
              sizeStyles[size],
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'font-medium cursor-pointer text-gray-900 dark:text-gray-100',
                  disabled && 'opacity-50 cursor-not-allowed',
                  labelSizeStyles[size]
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn('text-gray-500 dark:text-gray-400', size === 'sm' ? 'text-xs' : 'text-sm')}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export const RadioGroup = ({
  name,
  label,
  error,
  options,
  value,
  onChange,
  orientation = 'vertical',
  size = 'md',
  required,
}: RadioGroupProps) => {
  return (
    <fieldset>
      {label && (
        <legend
          className={cn(
            'text-sm font-medium mb-2',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </legend>
      )}
      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col space-y-3' : 'flex-row flex-wrap gap-x-6 gap-y-3'
        )}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
            disabled={option.disabled}
            size={size}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};

RadioGroup.displayName = 'RadioGroup';

export default Radio;
