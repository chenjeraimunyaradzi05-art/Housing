import type { Meta, StoryObj } from '@storybook/react';
import { Spinner, Loading } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Spinner> = {
  title: 'VÖR Design System/Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading spinners for indicating async operations.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-xs text-gray-500 mt-2">SM</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-xs text-gray-500 mt-2">MD</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-xs text-gray-500 mt-2">LG</p>
      </div>
      <div className="text-center">
        <Spinner size="xl" />
        <p className="text-xs text-gray-500 mt-2">XL</p>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <Spinner color="primary" />
        <p className="text-xs text-gray-500 mt-2">Primary</p>
      </div>
      <div className="text-center">
        <Spinner color="secondary" />
        <p className="text-xs text-gray-500 mt-2">Secondary</p>
      </div>
      <div className="text-center p-3 bg-gray-800 rounded-lg">
        <Spinner color="white" />
        <p className="text-xs text-white mt-2">White</p>
      </div>
      <div className="text-center text-teal-500">
        <Spinner color="current" />
        <p className="text-xs mt-2">Current</p>
      </div>
    </div>
  ),
};

export const LoadingComponent: Story = {
  render: () => (
    <Loading text="Loading properties..." />
  ),
};

export const LoadingWithoutText: Story = {
  render: () => (
    <Loading />
  ),
};

export const FullPageLoading: Story = {
  render: () => (
    <div className="w-[600px] h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
      <Loading text="Loading your dashboard..." size="lg" />
    </div>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      <span className="text-gray-600 dark:text-gray-400">Saving changes...</span>
    </div>
  ),
};

export const ButtonWithSpinner: Story = {
  render: () => (
    <div className="space-y-4">
      <Button isLoading>Submitting...</Button>
      <Button isLoading variant="secondary">Processing...</Button>
      <Button isLoading variant="outline">Loading...</Button>
    </div>
  ),
};

export const CardLoading: Story = {
  render: () => (
    <div className="w-80 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex flex-col items-center justify-center h-40">
        <Loading text="Fetching property data..." />
      </div>
    </div>
  ),
};

export const SkeletonAlternative: Story = {
  render: () => (
    <div className="w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading pattern as an alternative to spinners for content loading.',
      },
    },
  },
};
