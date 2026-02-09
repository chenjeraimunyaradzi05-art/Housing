'use client';

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
}

/**
 * Dropdown menu component with keyboard navigation
 */
export function Dropdown({
  trigger,
  items,
  align = 'left',
  className,
  menuClassName,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape as any);
      return () => document.removeEventListener('keydown', handleEscape as any);
    }
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent) => {
    const selectableItems = items.filter(item => !item.divider && !item.disabled);

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else if (activeIndex >= 0) {
          const item = selectableItems[activeIndex];
          item?.onClick?.();
          setIsOpen(false);
          setActiveIndex(-1);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex(prev =>
            prev < selectableItems.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setActiveIndex(prev =>
            prev > 0 ? prev - 1 : selectableItems.length - 1
          );
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    item.onClick?.();
    setIsOpen(false);
    setActiveIndex(-1);
  };

  let selectableIndex = -1;

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] py-1',
            'bg-white dark:bg-gray-900 rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 h-px bg-gray-200 dark:bg-gray-700"
                  role="separator"
                />
              );
            }

            selectableIndex++;
            const isActive = selectableIndex === activeIndex;

            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors',
                  'focus:outline-none',
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  isActive && !item.disabled && 'bg-gray-100 dark:bg-gray-800'
                )}
              >
                {item.icon && (
                  <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Simple dropdown trigger button
 */
export interface DropdownButtonProps {
  children: ReactNode;
  className?: string;
}

export function DropdownButton({ children, className }: DropdownButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium',
        'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700',
        'rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
        'transition-colors',
        className
      )}
    >
      {children}
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
