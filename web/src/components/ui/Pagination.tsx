'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 min-w-8 text-xs',
  md: 'h-10 min-w-10 text-sm',
  lg: 'h-12 min-w-12 text-base',
};

/**
 * Pagination component for navigating through pages
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',
  className,
}: PaginationProps) {
  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 for ellipsis

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, 'ellipsis', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, 'ellipsis', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
    }

    return [];
  }, [currentPage, totalPages, siblingCount]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const buttonBase = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeStyles[size]
  );

  const pageButton = cn(
    buttonBase,
    'px-3 hover:bg-gray-100 dark:hover:bg-gray-800'
  );

  const activePageButton = cn(
    buttonBase,
    'px-3 bg-rose-500 text-white hover:bg-rose-600'
  );

  const navButton = cn(
    buttonBase,
    'px-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  );

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center gap-1', className)}
    >
      {/* First page button */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          className={navButton}
          aria-label="Go to first page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Previous button */}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className={navButton}
          aria-label="Go to previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={cn(
                'px-2 text-gray-400 dark:text-gray-500',
                sizeStyles[size]
              )}
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={isActive ? activePageButton : pageButton}
            aria-label={`Go to page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next button */}
      {showPrevNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={navButton}
          aria-label="Go to next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className={navButton}
          aria-label="Go to last page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </nav>
  );
}

/**
 * Pagination info text component
 */
export interface PaginationInfoProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationInfoProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <p className={cn('text-sm text-gray-500 dark:text-gray-400', className)}>
      Showing <span className="font-medium">{start}</span> to{' '}
      <span className="font-medium">{end}</span> of{' '}
      <span className="font-medium">{totalItems}</span> results
    </p>
  );
}

/**
 * Complete pagination with info and controls
 */
export interface PaginationWithInfoProps extends PaginationProps {
  pageSize: number;
  totalItems: number;
}

export function PaginationWithInfo({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  ...paginationProps
}: PaginationWithInfoProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <PaginationInfo
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        {...paginationProps}
      />
    </div>
  );
}
