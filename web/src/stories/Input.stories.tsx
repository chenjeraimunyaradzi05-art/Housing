import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Input> = {
  title: 'VÖR Design System/Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with label, error states, and various sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    error: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
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
    placeholder: 'Enter your email',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'jane@example.com',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    helperText: 'Must be at least 8 characters',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Jane Doe',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Account ID',
    defaultValue: 'VOR-2024-001',
    disabled: true,
  },
};

export const WithClassName: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input className="text-sm py-1.5" placeholder="Smaller styling via className" />
      <Input placeholder="Default input" />
      <Input className="text-lg py-3" placeholder="Larger styling via className" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input
        label="Search Properties"
        placeholder="Search..."
        leftIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      <Input
        label="Website"
        placeholder="https://example.com"
        leftIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        }
      />
    </div>
  ),
};

export const InputTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input label="Text" type="text" placeholder="Enter text" />
      <Input label="Email" type="email" placeholder="jane@example.com" />
      <Input label="Password" type="password" placeholder="••••••••" />
      <Input label="Number" type="number" placeholder="0" />
      <Input label="Date" type="date" />
      <Input label="Phone" type="tel" placeholder="(555) 123-4567" />
    </div>
  ),
};
