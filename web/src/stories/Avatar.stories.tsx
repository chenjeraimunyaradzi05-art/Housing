import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@/components/ui/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'VÖR Design System/Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Avatar component for displaying user profile images with fallback support.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    alt: 'Sarah Johnson',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'SJ',
    alt: 'Sarah Johnson',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="xs" fallback="XS" />
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
      <Avatar size="xl" fallback="XL" />
    </div>
  ),
};

export const WithImages: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        alt="User 1"
        size="lg"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        alt="User 2"
        size="lg"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        alt="User 3"
        size="lg"
      />
    </div>
  ),
};

export const FallbackVariations: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar fallback="AB" size="lg" />
      <Avatar fallback="CD" size="lg" />
      <Avatar fallback="VÖ" size="lg" />
      <Avatar alt="Elena Rodriguez" size="lg" />
    </div>
  ),
};

export const InvestorProfiles: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
          alt="Sarah Johnson"
          size="lg"
        />
        <div>
          <p className="font-medium">Sarah Johnson</p>
          <p className="text-sm text-gray-500">Gold Member • 12 Investments</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar
          fallback="ER"
          alt="Elena Rodriguez"
          size="lg"
        />
        <div>
          <p className="font-medium">Elena Rodriguez</p>
          <p className="text-sm text-gray-500">Platinum Member • 28 Investments</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar
          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
          alt="Michelle Chen"
          size="lg"
        />
        <div>
          <p className="font-medium">Michelle Chen</p>
          <p className="text-sm text-gray-500">Rose Member • 5 Investments</p>
        </div>
      </div>
    </div>
  ),
};

export const CoInvestorStack: Story = {
  render: () => (
    <div>
      <p className="text-sm text-gray-500 mb-2">Co-Investors</p>
      <div className="flex -space-x-3">
        <Avatar
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
          alt="User 1"
          className="ring-2 ring-white"
        />
        <Avatar
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
          alt="User 2"
          className="ring-2 ring-white"
        />
        <Avatar
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
          alt="User 3"
          className="ring-2 ring-white"
        />
        <Avatar
          fallback="+4"
          className="ring-2 ring-white bg-rose-100 text-rose-700"
        />
      </div>
    </div>
  ),
};

export const LoadingState: Story = {
  args: {
    src: 'https://invalid-image-url.com/not-found.jpg',
    alt: 'User with broken image',
    fallback: 'US',
    size: 'lg',
  },
};
