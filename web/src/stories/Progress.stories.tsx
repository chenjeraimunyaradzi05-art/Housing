import type { Meta, StoryObj } from '@storybook/react';
import { Progress, CircularProgress, StepsProgress } from '@/components/ui/Progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
    max: 100,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
    label: 'Funding Progress',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Small</p>
        <Progress value={50} size="sm" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Medium (default)</p>
        <Progress value={50} size="md" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Large</p>
        <Progress value={50} size="lg" />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Default</p>
        <Progress value={60} variant="default" showLabel />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Success</p>
        <Progress value={100} variant="success" showLabel />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Warning</p>
        <Progress value={45} variant="warning" showLabel />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Danger</p>
        <Progress value={15} variant="danger" showLabel />
      </div>
    </div>
  ),
};

export const Circular: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <CircularProgress value={25} showLabel />
      <CircularProgress value={50} showLabel variant="success" />
      <CircularProgress value={75} showLabel size={64} strokeWidth={6} />
      <CircularProgress value={100} showLabel variant="success" size={80} />
    </div>
  ),
};

export const Steps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-4">Step 1 of 4</p>
        <StepsProgress currentStep={0} totalSteps={4} />
      </div>
      <div>
        <p className="text-sm font-medium mb-4">Step 2 of 4</p>
        <StepsProgress currentStep={1} totalSteps={4} />
      </div>
      <div>
        <p className="text-sm font-medium mb-4">Step 3 of 4</p>
        <StepsProgress currentStep={2} totalSteps={4} />
      </div>
      <div>
        <p className="text-sm font-medium mb-4">Completed</p>
        <StepsProgress currentStep={4} totalSteps={4} />
      </div>
    </div>
  ),
};

export const StepsWithLabels: Story = {
  render: () => (
    <StepsProgress
      currentStep={1}
      totalSteps={4}
      labels={['Account', 'Verification', 'Investment', 'Confirm']}
    />
  ),
};

export const InvestmentProgress: Story = {
  render: () => (
    <div className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Atlanta Tech Hub Portfolio</h3>
        <span className="text-sm text-gray-500">$850K / $2M</span>
      </div>
      <Progress value={850000} max={2000000} showLabel label="Funding Progress" />
      <div className="flex justify-between text-sm text-gray-500">
        <span>42 investors</span>
        <span>15 days left</span>
      </div>
    </div>
  ),
};
