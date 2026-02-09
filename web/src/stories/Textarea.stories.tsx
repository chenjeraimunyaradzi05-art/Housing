import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '@/components/ui/Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'VÖR Design System/Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Multi-line text input for longer form content.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Property Description',
    placeholder: 'Describe the property features, amenities, and neighborhood...',
    rows: 4,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Investment Notes',
    placeholder: 'Add notes about this investment...',
    helperText: 'These notes are private and only visible to you.',
    rows: 3,
  },
};

export const WithError: Story = {
  args: {
    label: 'Bio',
    defaultValue: 'Hi',
    error: 'Bio must be at least 50 characters',
    rows: 4,
  },
};

export const WithCharacterCount: Story = {
  args: {
    label: 'Review',
    placeholder: 'Write your property review...',
    maxLength: 500,
    showCharCount: true,
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Archived Notes',
    defaultValue: 'This property was previously listed at $380,000...',
    disabled: true,
    rows: 3,
  },
};

export const Resizable: Story = {
  args: {
    label: 'Comments',
    placeholder: 'Share your thoughts...',
    className: 'resize-y',
    rows: 3,
  },
};

export const Required: Story = {
  args: {
    label: 'Feedback',
    placeholder: 'Please provide your feedback...',
    required: true,
    rows: 4,
  },
};
