import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const meta: Meta<typeof Card> = {
  title: 'VÖR Design System/Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component for displaying content in a contained, elevated surface.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          This is the main content area of the card. You can put any content here.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const PropertyCard: Story = {
  render: () => (
    <Card variant="bordered">
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop"
          alt="Property"
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <Badge variant="success" className="absolute top-3 left-3">Active</Badge>
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold text-lg">123 Oak Street</h3>
        <p className="text-sm text-gray-500">Austin, TX 78701</p>
        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <span>3 bed</span>
          <span>2 bath</span>
          <span>1,850 sq ft</span>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xl font-bold text-rose-600">$425,000</span>
          <Badge variant="info" size="sm">8.5% IRR</Badge>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="primary" className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card variant="bordered" className="p-6">
      <CardContent>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">$1,250,000</p>
          <p className="text-sm text-teal-600 mt-1">↑ 12.5% this year</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const WithHover: Story = {
  render: () => (
    <Card hoverable>
      <CardHeader>
        <CardTitle>Investment Opportunity</CardTitle>
        <CardDescription>Co-investment pool opening soon</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">
          Hover over this card to see the interactive hover effect.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
        </CardHeader>
        <CardContent>Standard card with minimal styling</CardContent>
      </Card>
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Bordered Card</CardTitle>
        </CardHeader>
        <CardContent>Card with border styling</CardContent>
      </Card>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
        </CardHeader>
        <CardContent>Card with prominent shadow</CardContent>
      </Card>
    </div>
  ),
};

export const InvestmentSummary: Story = {
  render: () => (
    <Card variant="elevated" className="p-6">
      <CardHeader className="pb-4">
        <CardTitle>Investment Summary</CardTitle>
        <CardDescription>Your portfolio performance this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Total Invested</span>
          <span className="font-semibold">$150,000</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Current Value</span>
          <span className="font-semibold text-teal-600">$168,750</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-gray-600">Total Returns</span>
          <span className="font-semibold text-teal-600">+$18,750</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Monthly Distribution</span>
          <span className="font-semibold">$1,250</span>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Button variant="outline" className="w-full">View Full Report</Button>
      </CardFooter>
    </Card>
  ),
};

export const MembershipCard: Story = {
  render: () => (
    <Card className="bg-gradient-to-br from-rose-50 to-lavender-50 border border-rose-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-rose-800">Gold Membership</CardTitle>
          <Badge className="bg-gold-100 text-gold-800">Current Plan</Badge>
        </div>
        <CardDescription className="text-rose-600">Premium access to exclusive properties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600">✓ Access to 50+ exclusive listings</p>
        <p className="text-sm text-gray-600">✓ Priority co-investment access</p>
        <p className="text-sm text-gray-600">✓ Personal investment advisor</p>
        <p className="text-sm text-gray-600">✓ Quarterly portfolio review</p>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button variant="outline" size="sm">Manage Plan</Button>
        <Button variant="ghost" size="sm">Upgrade to Platinum</Button>
      </CardFooter>
    </Card>
  ),
};
