'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  format?: 'short' | 'medium' | 'long';
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Date Picker component
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  disabled = false,
  error,
  label,
  className,
  format = 'medium',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes
  useEffect(() => {
    if (value) {
      setViewDate(value);
    }
  }, [value]);

  // Format date for display
  const formatDate = (date: Date): string => {
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
      case 'long':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'medium':
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [viewDate]);

  // Check if a date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return false;
  };

  // Check if a date is selected
  const isDateSelected = (date: Date): boolean => {
    if (!value) return false;
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Navigate months
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Select a date
  const selectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange?.(date);
    setIsOpen(false);
  };

  // Clear date
  const clearDate = () => {
    onChange?.(null);
  };

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium mb-1.5',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {label}
        </label>
      )}

      {/* Input field */}
      <div className="relative">
        <button
          id={inputId}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center gap-2 px-4 py-2.5 text-left rounded-lg border',
            'bg-white dark:bg-gray-900 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            disabled && 'opacity-60 cursor-not-allowed',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-300 dark:border-gray-700 focus:border-rose-500 focus:ring-rose-500/20'
          )}
        >
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className={cn(
            'flex-1',
            value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
          )}>
            {value ? formatDate(value) : placeholder}
          </span>
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearDate();
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Calendar dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 mt-2 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg',
          'border border-gray-200 dark:border-gray-700',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    type="button"
                    onClick={() => selectDate(date)}
                    disabled={isDateDisabled(date)}
                    className={cn(
                      'w-full h-full flex items-center justify-center rounded-lg text-sm transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1',
                      isDateSelected(date)
                        ? 'bg-rose-500 text-white font-semibold'
                        : isToday(date)
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100',
                      isDateDisabled(date) && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {date.getDate()}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Today button */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                selectDate(today);
              }}
              className="w-full py-2 text-sm font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Date Range Picker
 */
export interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange?: (date: Date | null) => void;
  onEndDateChange?: (date: Date | null) => void;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  disabled = false,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex gap-4', className)}>
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        label={startLabel}
        maxDate={endDate || undefined}
        disabled={disabled}
        className="flex-1"
      />
      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        label={endLabel}
        minDate={startDate || undefined}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
