'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Container Component
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
}

const containerSizes = {
  sm: 'max-w-screen-sm',     // 640px
  md: 'max-w-screen-md',     // 768px
  lg: 'max-w-screen-lg',     // 1024px
  xl: 'max-w-screen-xl',     // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  full: 'max-w-full',
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'xl', centered = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full px-4 sm:px-6 lg:px-8',
          containerSizes[size],
          centered && 'mx-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

// Stack Component (Vertical or Horizontal)
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

const spacingStyles = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyStyles = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = 'column',
      spacing = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          direction === 'row' ? 'flex-row' : 'flex-col',
          spacingStyles[spacing],
          alignStyles[align],
          justifyStyles[justify],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

// Alias for horizontal stack
export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="row" {...props} />
);
HStack.displayName = 'HStack';

// Alias for vertical stack
export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="column" {...props} />
);
VStack.displayName = 'VStack';

// Grid Component
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const colsStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
  auto: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
};

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 'auto', gap = 'md', responsive = true, children, ...props }, ref) => {
    const responsiveClasses = responsive && typeof cols === 'number' && cols > 1
      ? `grid-cols-1 sm:grid-cols-2 md:${colsStyles[cols as keyof typeof colsStyles]}`
      : colsStyles[cols as keyof typeof colsStyles];

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          responsive ? responsiveClasses : colsStyles[cols as keyof typeof colsStyles],
          spacingStyles[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

// Box Component (generic div with utility props)
export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'header' | 'footer' | 'nav';
  p?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  m?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  bg?: 'transparent' | 'white' | 'gray' | 'primary' | 'secondary';
}

const paddingStyles = {
  none: '',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const marginStyles = {
  none: '',
  xs: 'm-1',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8',
  auto: 'm-auto',
};

const roundedStyles = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

const bgStyles = {
  transparent: '',
  white: 'bg-white dark:bg-gray-900',
  gray: 'bg-gray-100 dark:bg-gray-800',
  primary: 'bg-rose-50 dark:bg-rose-950',
  secondary: 'bg-lavender-50 dark:bg-lavender-950',
};

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      className,
      as: Component = 'div',
      p = 'none',
      m = 'none',
      rounded = 'none',
      shadow = 'none',
      bg = 'transparent',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          paddingStyles[p],
          marginStyles[m],
          roundedStyles[rounded],
          shadowStyles[shadow],
          bgStyles[bg],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Box.displayName = 'Box';

// Divider Component
export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = 'horizontal', variant = 'solid', label, ...props }, ref) => {
    const variantStyles = {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    };

    if (label) {
      return (
        <div className={cn('relative flex items-center', className)}>
          <div className={cn('flex-grow border-t border-gray-200 dark:border-gray-700', variantStyles[variant])} />
          <span className="px-3 text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <div className={cn('flex-grow border-t border-gray-200 dark:border-gray-700', variantStyles[variant])} />
        </div>
      );
    }

    if (orientation === 'vertical') {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
            'h-full w-px bg-gray-200 dark:bg-gray-700',
            className
          )}
          role="separator"
          aria-orientation="vertical"
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }

    return (
      <hr
        ref={ref}
        className={cn(
          'border-t border-gray-200 dark:border-gray-700',
          variantStyles[variant],
          className
        )}
        role="separator"
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

// Center Component
export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  inline?: boolean;
}

export const Center = React.forwardRef<HTMLDivElement, CenterProps>(
  ({ className, inline = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          inline ? 'inline-flex' : 'flex',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Center.displayName = 'Center';

export default Container;
