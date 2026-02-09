import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonTableRow } from '@/components/ui/Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    variant: 'text',
    width: '100%',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Text</p>
        <Skeleton variant="text" width="100%" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Circular</p>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rectangular</p>
        <Skeleton variant="rectangular" width="100%" height={120} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rounded</p>
        <Skeleton variant="rounded" width="100%" height={120} />
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Pulse (default)</p>
        <Skeleton animation="pulse" width="100%" height={40} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">None</p>
        <Skeleton animation="none" width="100%" height={40} />
      </div>
    </div>
  ),
};

export const TextLines: Story = {
  render: () => (
    <div className="max-w-md">
      <SkeletonText lines={4} />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="max-w-sm">
      <SkeletonCard hasImage lines={3} />
    </div>
  ),
};

export const Avatars: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <SkeletonAvatar size="xs" />
      <SkeletonAvatar size="sm" />
      <SkeletonAvatar size="md" />
      <SkeletonAvatar size="lg" />
      <SkeletonAvatar size="xl" />
    </div>
  ),
};

export const TableRows: Story = {
  render: () => (
    <table className="w-full">
      <tbody>
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
        <SkeletonTableRow columns={4} />
      </tbody>
    </table>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Profile card loading */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm flex items-center gap-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1">
          <Skeleton variant="text" width="40%" height={20} className="mb-2" />
          <Skeleton variant="text" width="60%" height={14} />
        </div>
      </div>

      {/* Property cards loading */}
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  ),
};
