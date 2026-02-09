'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeStyles = {
  sm: 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5',
  lg: 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6',
};

export function ThemeToggle({ className, size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <ComputerIcon />;
    }
    if (resolvedTheme === 'dark') {
      return <MoonIcon />;
    }
    return <SunIcon />;
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors',
        'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        'dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2',
        sizeStyles[size],
        showLabel && 'gap-2 px-3',
        className
      )}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {getIcon()}
      {showLabel && <span className="text-sm font-medium">{getLabel()}</span>}
    </button>
  );
}

// Sun icon for light mode
const SunIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// Moon icon for dark mode
const MoonIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

// Computer icon for system mode
const ComputerIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
