'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  labelPosition?: 'left' | 'right';
}

const sizeStyles = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
  },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      size = 'md',
      labelPosition = 'right',
      id,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const styles = sizeStyles[size];

    const toggle = (
      <div className="relative inline-flex flex-shrink-0">
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          disabled={disabled}
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            'pointer-events-none inline-flex items-center rounded-full transition-colors duration-200',
            'bg-gray-200 peer-checked:bg-rose-500',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 peer-focus-visible:ring-offset-2',
            'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
            'dark:bg-gray-700 dark:peer-checked:bg-rose-500',
            styles.track
          )}
        >
          <span
            className={cn(
              'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
              'transform translate-x-0.5 peer-checked:' + styles.translate,
              checked && styles.translate,
              styles.thumb
            )}
          />
        </span>
      </div>
    );

    if (!label && !description) {
      return <label className={cn('inline-flex cursor-pointer', disabled && 'cursor-not-allowed', className)}>{toggle}</label>;
    }

    return (
      <label
        htmlFor={switchId}
        className={cn(
          'inline-flex items-center gap-3 cursor-pointer',
          disabled && 'cursor-not-allowed',
          labelPosition === 'left' && 'flex-row-reverse',
          className
        )}
      >
        {toggle}
        <div className="flex flex-col">
          {label && (
            <span
              className={cn(
                'font-medium text-gray-900 dark:text-gray-100',
                disabled && 'opacity-50',
                size === 'sm' ? 'text-sm' : 'text-base'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className={cn(
                'text-gray-500 dark:text-gray-400',
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}
            >
              {description}
            </span>
          )}
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
