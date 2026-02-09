'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'md', fallback, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const sizeStyles = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const getFallbackText = () => {
      if (fallback) return fallback;
      if (alt) {
        const words = alt.split(' ');
        if (words.length >= 2) {
          return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return alt.slice(0, 2).toUpperCase();
      }
      return '?';
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600 overflow-hidden',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{getFallbackText()}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  children: React.ReactNode;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 4, children, ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="ring-2 ring-white rounded-full">
            {child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-300 font-medium text-gray-600 text-sm ring-2 ring-white">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';
