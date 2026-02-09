import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '@/components/ui/Select';

const meta: Meta<typeof Select> = {
  title: 'VÖR Design System/Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Dropdown select component for choosing from a list of options.',
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

const propertyTypes = [
  { value: 'single-family', label: 'Single Family Home' },
  { value: 'condo', label: 'Condo/Townhouse' },
  { value: 'multi-family', label: 'Multi-Family' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
];

const states = [
  { value: 'tx', label: 'Texas' },
  { value: 'ca', label: 'California' },
  { value: 'fl', label: 'Florida' },
  { value: 'ny', label: 'New York' },
  { value: 'az', label: 'Arizona' },
];

export const Default: Story = {
  args: {
    options: propertyTypes,
    placeholder: 'Select property type',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Property Type',
    options: propertyTypes,
    placeholder: 'Choose a type',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'State',
    options: states,
    placeholder: 'Select state',
    helperText: 'Select the state where you want to invest',
  },
};

export const WithError: Story = {
  args: {
    label: 'Property Type',
    options: propertyTypes,
    placeholder: 'Select property type',
    error: 'Please select a property type',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Property Type',
    options: propertyTypes,
    defaultValue: 'single-family',
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Investment Type',
    options: [
      { value: 'solo', label: 'Sole Investment' },
      { value: 'co-invest', label: 'Co-Investment Pool' },
      { value: 'syndicate', label: 'Syndicate' },
    ],
    placeholder: 'Select investment type',
    required: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Select size="sm" options={propertyTypes} placeholder="Small select" />
      <Select size="md" options={propertyTypes} placeholder="Medium select (default)" />
      <Select size="lg" options={propertyTypes} placeholder="Large select" />
    </div>
  ),
};

export const LocationOptions: Story = {
  args: {
    label: 'Location',
    placeholder: 'Select a city',
    options: [
      { value: 'austin', label: 'Austin, TX' },
      { value: 'dallas', label: 'Dallas, TX' },
      { value: 'houston', label: 'Houston, TX' },
      { value: 'la', label: 'Los Angeles, CA' },
      { value: 'sf', label: 'San Francisco, CA' },
      { value: 'sd', label: 'San Diego, CA' },
    ],
  },
};

export const PriceRanges: Story = {
  args: {
    label: 'Price Range',
    placeholder: 'Select price range',
    options: [
      { value: '0-200k', label: '$0 - $200,000' },
      { value: '200k-400k', label: '$200,000 - $400,000' },
      { value: '400k-600k', label: '$400,000 - $600,000' },
      { value: '600k-1m', label: '$600,000 - $1,000,000' },
      { value: '1m+', label: '$1,000,000+' },
    ],
  },
};
