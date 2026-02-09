import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb, BreadcrumbFromPath } from '@/components/ui/Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Properties', href: '/properties' },
      { label: 'Atlanta', href: '/properties/atlanta' },
      { label: 'Modern Downtown Condo' },
    ],
  },
};

export const WithHomeIcon: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Investments', href: '/dashboard/investments' },
      { label: 'Atlanta Tech Hub' },
    ],
    homeIcon: true,
  },
};

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'About Us' },
    ],
  },
};

export const Collapsed: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Real Estate', href: '/products/real-estate' },
      { label: 'Co-Investment', href: '/products/real-estate/co-investment' },
      { label: 'Pools', href: '/products/real-estate/co-investment/pools' },
      { label: 'Atlanta Tech Hub' },
    ],
    maxItems: 4,
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        label: 'Investments',
        href: '/dashboard/investments',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      { label: 'Portfolio Details' },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Category', href: '/category' },
      { label: 'Item' },
    ],
    separator: <span className="text-gray-400 mx-1">/</span>,
  },
};

export const FromPath: Story = {
  render: () => (
    <div className="space-y-4">
      <BreadcrumbFromPath path="/dashboard/investments/pools" />
      <BreadcrumbFromPath path="/properties/atlanta/modern-condo" homeIcon />
    </div>
  ),
};
