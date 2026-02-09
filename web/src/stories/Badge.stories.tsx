import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'VÖR Design System/Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge component for status indicators, labels, and counts.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const MembershipTiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default" size="lg">Free</Badge>
      <Badge className="bg-rose-100 text-rose-800" size="lg">Rose</Badge>
      <Badge className="bg-gold-100 text-gold-800" size="lg">Gold</Badge>
      <Badge className="bg-lavender-100 text-lavender-800" size="lg">Platinum</Badge>
    </div>
  ),
};

export const PropertyStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="error">Sold</Badge>
      <Badge variant="info">Coming Soon</Badge>
    </div>
  ),
};

export const InvestmentStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="info">Funding</Badge>
      <Badge variant="success">Funded</Badge>
      <Badge variant="default">Closed</Badge>
      <Badge variant="warning">Distributing</Badge>
    </div>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Properties</span>
        <Badge variant="info" size="sm">24</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Messages</span>
        <Badge variant="error" size="sm">3</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Notifications</span>
        <Badge variant="warning" size="sm">12</Badge>
      </div>
    </div>
  ),
};

export const PropertyCard: Story = {
  render: () => (
    <div className="border rounded-lg p-4 max-w-sm">
      <div className="flex justify-between items-start mb-3">
        <Badge variant="success">Active</Badge>
        <Badge className="bg-rose-100 text-rose-800" size="sm">Co-Investment</Badge>
      </div>
      <h3 className="font-semibold mb-1">123 Main Street</h3>
      <p className="text-sm text-gray-500 mb-3">Austin, TX • 3 bed • 2 bath</p>
      <div className="flex gap-2">
        <Badge variant="info" size="sm">8.5% IRR</Badge>
        <Badge variant="default" size="sm">$425,000</Badge>
      </div>
    </div>
  ),
};
