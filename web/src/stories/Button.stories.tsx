import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'VÖR Design System/Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Designed for VÖR\'s feminine, sophisticated aesthetic.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'link'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Primary Button
export const Primary: Story = {
  args: {
    children: 'Get Started',
    variant: 'primary',
  },
};

// Secondary Button
export const Secondary: Story = {
  args: {
    children: 'Learn More',
    variant: 'secondary',
  },
};

// Outline Button
export const Outline: Story = {
  args: {
    children: 'View Details',
    variant: 'outline',
  },
};

// Ghost Button
export const Ghost: Story = {
  args: {
    children: 'Cancel',
    variant: 'ghost',
  },
};

// Danger Button
export const Danger: Story = {
  args: {
    children: 'Delete Account',
    variant: 'danger',
  },
};

// Success Button
export const Success: Story = {
  args: {
    children: 'Confirm Purchase',
    variant: 'success',
  },
};

// Link Button
export const Link: Story = {
  args: {
    children: 'Read more',
    variant: 'link',
  },
};

// All Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// Loading State
export const Loading: Story = {
  args: {
    children: 'Submitting...',
    isLoading: true,
  },
};

// Disabled State
export const Disabled: Story = {
  args: {
    children: 'Unavailable',
    disabled: true,
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    children: 'Create Free Account',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button
        leftIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        Add Property
      </Button>
      <Button
        variant="secondary"
        rightIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        }
      >
        Continue
      </Button>
    </div>
  ),
};

// All Variants Gallery
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
};
