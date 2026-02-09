import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Positions: Story = {
  render: () => (
    <div className="flex gap-8 p-12">
      <Tooltip content="Tooltip on top" position="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <Tooltip content="Tooltip on bottom" position="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <Tooltip content="Tooltip on left" position="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
      <Tooltip content="Tooltip on right" position="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
    </div>
  ),
};

export const WithDelay: Story = {
  args: {
    content: 'This tooltip has a 500ms delay',
    delay: 500,
    children: <Button>Hover and wait</Button>,
  },
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer tooltip that will wrap to multiple lines when the content exceeds the maximum width.',
    children: <Button>Long tooltip</Button>,
  },
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip content="Click to edit your profile">
      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </Tooltip>
  ),
};

export const Disabled: Story = {
  args: {
    content: 'This tooltip is disabled',
    disabled: true,
    children: <Button>No tooltip</Button>,
  },
};

export const RichContent: Story = {
  render: () => (
    <Tooltip
      content={
        <div className="space-y-1">
          <p className="font-semibold">Investment Details</p>
          <p className="text-xs opacity-80">ROI: 12.5% | Risk: Moderate</p>
        </div>
      }
    >
      <Button>Rich tooltip</Button>
    </Tooltip>
  ),
};
