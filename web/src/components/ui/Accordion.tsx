'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Accordion Context
interface AccordionContextType {
  expandedItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion provider');
  }
  return context;
}

// Accordion Item Context
interface AccordionItemContextType {
  value: string;
  isExpanded: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextType | undefined>(undefined);

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within an AccordionItem provider');
  }
  return context;
}

// Accordion Root
export interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = 'single',
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const normalizeValue = (val: string | string[] | undefined): string[] => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  const [internalValue, setInternalValue] = useState<string[]>(normalizeValue(defaultValue));
  const expandedItems = value !== undefined ? normalizeValue(value) : internalValue;

  const toggleItem = useCallback(
    (itemValue: string) => {
      let newValue: string[];

      if (type === 'single') {
        newValue = expandedItems.includes(itemValue) ? [] : [itemValue];
      } else {
        newValue = expandedItems.includes(itemValue)
          ? expandedItems.filter((v) => v !== itemValue)
          : [...expandedItems, itemValue];
      }

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onValueChange?.(type === 'single' ? (newValue[0] || '') : newValue);
    },
    [expandedItems, type, value, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem, type }}>
      <div className={cn('divide-y divide-gray-200 dark:divide-gray-700', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// Accordion Item
export interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function AccordionItem({ value, children, className, disabled }: AccordionItemProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded }}>
      <div
        className={cn(
          'py-2',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
        data-state={isExpanded ? 'open' : 'closed'}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Accordion Trigger
export interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext();
  const { value, isExpanded } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      aria-expanded={isExpanded}
      aria-controls={`accordion-content-${value}`}
      className={cn(
        'flex w-full items-center justify-between py-4 text-left font-medium transition-all',
        'text-gray-900 dark:text-gray-100 hover:text-rose-600 dark:hover:text-rose-400',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded',
        className
      )}
    >
      {children}
      <ChevronIcon
        className={cn(
          'h-5 w-5 flex-shrink-0 text-gray-500 transition-transform duration-200',
          isExpanded && 'rotate-180'
        )}
      />
    </button>
  );
}

// Accordion Content
export interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const { value, isExpanded } = useAccordionItemContext();

  return (
    <div
      id={`accordion-content-${value}`}
      role="region"
      aria-labelledby={`accordion-trigger-${value}`}
      hidden={!isExpanded}
      className={cn(
        'overflow-hidden transition-all duration-200',
        isExpanded ? 'animate-slide-down' : 'h-0',
        className
      )}
    >
      <div className="pb-4 text-gray-600 dark:text-gray-400">{children}</div>
    </div>
  );
}

// Chevron Icon
const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

Accordion.displayName = 'Accordion';
AccordionItem.displayName = 'AccordionItem';
AccordionTrigger.displayName = 'AccordionTrigger';
AccordionContent.displayName = 'AccordionContent';

export default Accordion;
