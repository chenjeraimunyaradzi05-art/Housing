import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Switch } from '@/components/ui/Switch';

// Checkbox Meta
const checkboxMeta: Meta<typeof Checkbox> = {
  title: 'VÖR Design System/Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Checkbox component for multiple selections.',
      },
    },
  },
  tags: ['autodocs'],
};

export default checkboxMeta;
type CheckboxStory = StoryObj<typeof checkboxMeta>;

export const Default: CheckboxStory = {
  args: {
    label: 'I agree to the terms and conditions',
  },
};

export const Checked: CheckboxStory = {
  args: {
    label: 'Receive email notifications',
    defaultChecked: true,
  },
};

export const WithDescription: CheckboxStory = {
  args: {
    label: 'Enable two-factor authentication',
    description: 'Add an extra layer of security to your account',
  },
};

export const Disabled: CheckboxStory = {
  args: {
    label: 'Premium feature (upgrade required)',
    disabled: true,
  },
};

export const DisabledChecked: CheckboxStory = {
  args: {
    label: 'Required setting',
    disabled: true,
    defaultChecked: true,
  },
};

export const CheckboxGroup: CheckboxStory = {
  render: () => (
    <div className="space-y-3">
      <p className="font-medium text-sm">Property Amenities</p>
      <Checkbox label="Swimming Pool" />
      <Checkbox label="Garage" defaultChecked />
      <Checkbox label="Garden/Yard" />
      <Checkbox label="Central AC/Heating" defaultChecked />
      <Checkbox label="Fireplace" />
      <Checkbox label="Home Office" />
    </div>
  ),
};

export const Sizes: CheckboxStory = {
  render: () => (
    <div className="space-y-4">
      <Checkbox size="sm" label="Small checkbox" />
      <Checkbox size="md" label="Medium checkbox (default)" />
      <Checkbox size="lg" label="Large checkbox" />
    </div>
  ),
};

export const WithError: CheckboxStory = {
  args: {
    label: 'I accept the investment terms',
    error: 'You must accept the terms to continue',
  },
};
