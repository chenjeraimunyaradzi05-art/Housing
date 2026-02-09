import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownButton } from '@/components/ui/Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

const defaultItems = [
  { id: 'profile', label: 'View Profile', onClick: () => console.log('Profile clicked') },
  { id: 'settings', label: 'Settings', onClick: () => console.log('Settings clicked') },
  { id: 'divider1', label: '', divider: true },
  { id: 'logout', label: 'Sign Out', danger: true, onClick: () => console.log('Logout clicked') },
];

export const Default: Story = {
  args: {
    trigger: <DropdownButton>Options</DropdownButton>,
    items: defaultItems,
  },
};

export const WithIcons: Story = {
  args: {
    trigger: <DropdownButton>Account</DropdownButton>,
    items: [
      {
        id: 'profile',
        label: 'Profile',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      { id: 'divider1', label: '', divider: true },
      {
        id: 'logout',
        label: 'Sign Out',
        danger: true,
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ),
      },
    ],
  },
};

export const RightAligned: Story = {
  args: {
    trigger: <DropdownButton>Right Aligned</DropdownButton>,
    items: defaultItems,
    align: 'right',
  },
};

export const WithDisabledItems: Story = {
  args: {
    trigger: <DropdownButton>Actions</DropdownButton>,
    items: [
      { id: 'edit', label: 'Edit' },
      { id: 'duplicate', label: 'Duplicate' },
      { id: 'archive', label: 'Archive', disabled: true },
      { id: 'divider1', label: '', divider: true },
      { id: 'delete', label: 'Delete', danger: true, disabled: true },
    ],
  },
};

export const CustomTrigger: Story = {
  render: () => (
    <Dropdown
      trigger={
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      }
      items={[
        { id: 'view', label: 'View Details' },
        { id: 'edit', label: 'Edit' },
        { id: 'share', label: 'Share' },
        { id: 'divider1', label: '', divider: true },
        { id: 'delete', label: 'Delete', danger: true },
      ]}
      align="right"
    />
  ),
};

export const AvatarDropdown: Story = {
  render: () => (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-medium">
            SJ
          </div>
          <span className="text-sm font-medium">Sarah Johnson</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      }
      items={[
        { id: 'profile', label: 'Your Profile' },
        { id: 'investments', label: 'My Investments' },
        { id: 'settings', label: 'Settings' },
        { id: 'divider1', label: '', divider: true },
        { id: 'help', label: 'Help & Support' },
        { id: 'logout', label: 'Sign Out', danger: true },
      ]}
      align="right"
    />
  ),
};
