import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'VÖR Design System/Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Theme toggle component for switching between light, dark, and system themes.',
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
        <ThemeToggle size="sm" />
        <p className="text-xs text-gray-500 mt-2">Small</p>
      </div>
      <div className="text-center">
        <ThemeToggle size="md" />
        <p className="text-xs text-gray-500 mt-2">Medium</p>
      </div>
      <div className="text-center">
        <ThemeToggle size="lg" />
        <p className="text-xs text-gray-500 mt-2">Large</p>
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    showLabel: true,
  },
};

export const InHeader: Story = {
  render: () => (
    <div className="w-[600px] bg-white dark:bg-gray-900 shadow-md rounded-lg">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-semibold text-lg">VÖR</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-rose-500">Properties</a>
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-rose-500">Invest</a>
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-rose-500">Community</a>
          <ThemeToggle />
        </nav>
      </header>
    </div>
  ),
};

export const InSettings: Story = {
  render: () => (
    <div className="w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="font-semibold mb-4">Appearance</h3>
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="font-medium">Theme</p>
          <p className="text-sm text-gray-500">Choose your preferred theme</p>
        </div>
        <ThemeToggle showLabel />
      </div>
    </div>
  ),
};
