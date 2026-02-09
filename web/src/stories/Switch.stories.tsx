import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@/components/ui/Switch';

const meta: Meta<typeof Switch> = {
  title: 'VÖR Design System/Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toggle switch for boolean on/off states.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'Dark mode',
    defaultChecked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Email updates',
    description: 'Receive weekly digest of new investment opportunities',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Two-factor authentication',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Required setting',
    disabled: true,
    defaultChecked: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch size="sm" label="Small switch" />
      <Switch size="md" label="Medium switch (default)" />
      <Switch size="lg" label="Large switch" />
    </div>
  ),
};

export const SettingsPanel: Story = {
  render: () => (
    <div className="max-w-md space-y-1">
      <h3 className="font-semibold mb-4">Notification Settings</h3>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="Email Notifications"
          description="Receive emails about new properties and investment updates"
          defaultChecked
        />
      </div>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="Push Notifications"
          description="Get instant alerts on your mobile device"
          defaultChecked
        />
      </div>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="SMS Alerts"
          description="Important updates via text message"
        />
      </div>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="Marketing Communications"
          description="News, tips, and promotional content"
        />
      </div>
      <div className="py-3">
        <Switch
          label="Portfolio Reports"
          description="Weekly summary of your investment performance"
          defaultChecked
        />
      </div>
    </div>
  ),
};

export const PrivacySettings: Story = {
  render: () => (
    <div className="max-w-md space-y-1">
      <h3 className="font-semibold mb-4">Privacy Settings</h3>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="Profile Visibility"
          description="Allow other VÖR members to view your profile"
          defaultChecked
        />
      </div>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="Show Investment History"
          description="Display your past investments on your profile"
        />
      </div>
      <div className="py-3 border-b border-gray-200 dark:border-gray-700">
        <Switch
          label="Co-Investment Invitations"
          description="Allow members to invite you to investment pools"
          defaultChecked
        />
      </div>
      <div className="py-3">
        <Switch
          label="Data Analytics"
          description="Help improve VÖR by sharing anonymous usage data"
          defaultChecked
        />
      </div>
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch label="Default (Rose)" defaultChecked />
      <Switch label="Success (Teal)" defaultChecked className="[&_[data-checked]]:bg-teal-500" />
      <Switch label="Secondary (Lavender)" defaultChecked className="[&_[data-checked]]:bg-lavender-500" />
      <Switch label="Warning (Gold)" defaultChecked className="[&_[data-checked]]:bg-gold-500" />
    </div>
  ),
};
