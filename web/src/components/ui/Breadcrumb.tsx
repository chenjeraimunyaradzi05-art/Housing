'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
  maxItems?: number;
  homeIcon?: boolean;
}

const DefaultSeparator = () => (
  <svg
    className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

/**
 * Breadcrumb navigation component
 */
export function Breadcrumb({
  items,
  separator,
  className,
  maxItems,
  homeIcon = false,
}: BreadcrumbProps) {
  const SeparatorComponent = separator || <DefaultSeparator />;

  // Handle collapsed breadcrumbs when maxItems is set
  let displayItems = items;
  let showEllipsis = false;

  if (maxItems && items.length > maxItems) {
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    displayItems = [firstItem, ...lastItems];
    showEllipsis = true;
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;
          const showEllipsisHere = showEllipsis && index === 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {/* Ellipsis for collapsed items */}
              {showEllipsisHere && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">...</span>
                  {SeparatorComponent}
                </>
              )}

              {/* Separator (not before first item) */}
              {index > 0 && !showEllipsisHere && SeparatorComponent}

              {/* Breadcrumb item */}
              {isLast ? (
                <span
                  className={cn(
                    'font-medium text-gray-900 dark:text-gray-100',
                    'flex items-center gap-1.5'
                  )}
                  aria-current="page"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                    'transition-colors flex items-center gap-1.5'
                  )}
                >
                  {isFirst && homeIcon ? <HomeIcon /> : item.icon}
                  {!(isFirst && homeIcon) && item.label}
                </Link>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  {isFirst && homeIcon ? <HomeIcon /> : item.icon}
                  {!(isFirst && homeIcon) && item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Simple breadcrumb from path string
 */
export interface BreadcrumbFromPathProps {
  path: string;
  homeLabel?: string;
  className?: string;
  homeIcon?: boolean;
}

export function BreadcrumbFromPath({
  path,
  homeLabel = 'Home',
  className,
  homeIcon = false,
}: BreadcrumbFromPathProps) {
  const segments = path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [
    { label: homeLabel, href: '/' },
    ...segments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + segments.slice(0, index + 1).join('/'),
    })),
  ];

  return <Breadcrumb items={items} className={className} homeIcon={homeIcon} />;
}
