import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'VÖR Design System/Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tabs component for organizing content into switchable panels.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-2">
          <h3 className="font-semibold mb-2">Property Overview</h3>
          <p className="text-gray-600 dark:text-gray-400">
            View key details about your property portfolio including total value, cash flow, and appreciation.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-2">
          <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Track performance metrics, ROI calculations, and market comparisons.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-2">
          <h3 className="font-semibold mb-2">Settings</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Configure notifications, preferences, and account settings.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const PropertyTabs: Story = {
  render: () => (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="financials">Financials</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <div className="p-4 space-y-3 mt-2">
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Address</span>
            <span className="font-medium">123 Main St, Austin, TX</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Property Type</span>
            <span className="font-medium">Single Family</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Year Built</span>
            <span className="font-medium">2019</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Square Feet</span>
            <span className="font-medium">2,450</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="financials">
        <div className="p-4 space-y-3 mt-2">
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Purchase Price</span>
            <span className="font-medium">$425,000</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Current Value</span>
            <span className="font-medium text-teal-600">$485,000</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Monthly Rent</span>
            <span className="font-medium">$2,800</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">ROI</span>
            <span className="font-medium text-teal-600">14.1%</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="documents">
        <div className="p-4 mt-2">
          <p className="text-gray-500 text-center py-8">
            3 documents available for download
          </p>
        </div>
      </TabsContent>
      <TabsContent value="history">
        <div className="p-4 mt-2">
          <p className="text-gray-500 text-center py-8">
            View property history and transactions
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const BasicTabs: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-gray-500 mb-2">Basic Tab Navigation</p>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content for Tab 1</TabsContent>
          <TabsContent value="tab2">Content for Tab 2</TabsContent>
          <TabsContent value="tab3">Content for Tab 3</TabsContent>
        </Tabs>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="home">
      <TabsList>
        <TabsTrigger value="home" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </TabsTrigger>
        <TabsTrigger value="properties" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Properties
        </TabsTrigger>
        <TabsTrigger value="investments" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Investments
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">
        <div className="p-4 mt-2 text-gray-600 dark:text-gray-400">
          Welcome to your dashboard
        </div>
      </TabsContent>
      <TabsContent value="properties">
        <div className="p-4 mt-2 text-gray-600 dark:text-gray-400">
          Your property listings
        </div>
      </TabsContent>
      <TabsContent value="investments">
        <div className="p-4 mt-2 text-gray-600 dark:text-gray-400">
          Investment portfolio
        </div>
      </TabsContent>
    </Tabs>
  ),
};
