import type { Meta, StoryObj } from '@storybook/react';
import { Radio, RadioGroup } from '@/components/ui/Radio';

const meta: Meta<typeof RadioGroup> = {
  title: 'VÖR Design System/Components/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Radio button component for single selection from multiple options.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'membership',
    label: 'Membership Tier',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'rose', label: 'Rose' },
      { value: 'gold', label: 'Gold' },
      { value: 'platinum', label: 'Platinum' },
    ],
  },
};

export const WithDescriptions: Story = {
  args: {
    name: 'plan',
    label: 'Select Your Plan',
    options: [
      {
        value: 'basic',
        label: 'Basic',
        description: 'Perfect for getting started with property browsing'
      },
      {
        value: 'pro',
        label: 'Pro',
        description: 'Access to exclusive listings and co-investment pools'
      },
      {
        value: 'enterprise',
        label: 'Enterprise',
        description: 'Full suite of tools for serious investors'
      },
    ],
  },
};

export const Horizontal: Story = {
  args: {
    name: 'frequency',
    label: 'Distribution Frequency',
    orientation: 'horizontal',
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
    ],
  },
};

export const WithDisabled: Story = {
  args: {
    name: 'tier',
    label: 'Membership Options',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'rose', label: 'Rose' },
      { value: 'gold', label: 'Gold', disabled: true },
      { value: 'platinum', label: 'Platinum', disabled: true },
    ],
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <RadioGroup
        name="size-sm"
        label="Small Size"
        size="sm"
        options={[
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
        ]}
      />
      <RadioGroup
        name="size-md"
        label="Medium Size (Default)"
        size="md"
        options={[
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
        ]}
      />
      <RadioGroup
        name="size-lg"
        label="Large Size"
        size="lg"
        options={[
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
        ]}
      />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    name: 'required-field',
    label: 'Investment Type',
    error: 'Please select an investment type',
    required: true,
    options: [
      { value: 'direct', label: 'Direct Investment' },
      { value: 'co-invest', label: 'Co-Investment Pool' },
      { value: 'reit', label: 'REIT' },
    ],
  },
};

export const PropertyType: Story = {
  args: {
    name: 'property-type',
    label: 'Property Type',
    options: [
      {
        value: 'single-family',
        label: 'Single Family',
        description: 'Standalone residential homes'
      },
      {
        value: 'multi-family',
        label: 'Multi-Family',
        description: 'Duplexes, triplexes, apartment buildings'
      },
      {
        value: 'commercial',
        label: 'Commercial',
        description: 'Office, retail, and mixed-use properties'
      },
      {
        value: 'land',
        label: 'Land',
        description: 'Undeveloped land for future development'
      },
    ],
  },
};

export const SingleRadio: Story = {
  render: () => (
    <div className="space-y-3">
      <Radio name="terms" value="agree" label="I agree to the terms and conditions" />
      <Radio
        name="newsletter"
        value="subscribe"
        label="Subscribe to newsletter"
        description="Receive weekly updates on new investment opportunities"
      />
    </div>
  ),
};
