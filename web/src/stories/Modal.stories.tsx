import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Modal> = {
  title: 'VÖR Design System/Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal dialog for displaying content that requires user attention or interaction.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive example with state
const ModalDemo = ({ size, title, children }: { size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size={size}>
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalDemo title="Welcome to VÖR">
      <p className="text-gray-600 dark:text-gray-400">
        Thank you for joining VÖR! We're excited to help you on your real estate investment journey.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost">Later</Button>
        <Button>Get Started</Button>
      </div>
    </ModalDemo>
  ),
};

export const SmallModal: Story = {
  render: () => (
    <ModalDemo title="Confirm Action" size="sm">
      <p className="text-gray-600 dark:text-gray-400">
        Are you sure you want to remove this property from your saved list?
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button variant="danger" size="sm">Remove</Button>
      </div>
    </ModalDemo>
  ),
};

export const LargeModal: Story = {
  render: () => (
    <ModalDemo title="Property Details" size="lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="aspect-video bg-gradient-to-br from-rose-100 to-lavender-100 rounded-lg" />
        <div className="aspect-video bg-gradient-to-br from-teal-100 to-gold-100 rounded-lg" />
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-lg">Modern Downtown Condo</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Beautiful 3-bedroom condo in the heart of Austin's downtown district.
          Features include modern finishes, floor-to-ceiling windows, and stunning city views.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-gray-500">Bedrooms</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-gray-500">Bathrooms</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold">1,450</p>
            <p className="text-sm text-gray-500">Sq Ft</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline">Schedule Tour</Button>
        <Button>Request Info</Button>
      </div>
    </ModalDemo>
  ),
};

export const FormModal: Story = {
  render: () => (
    <ModalDemo title="Contact Agent" size="md">
      <div className="space-y-4">
        <Input label="Your Name" placeholder="Jane Doe" />
        <Input label="Email" type="email" placeholder="jane@example.com" />
        <Input label="Phone" type="tel" placeholder="(555) 123-4567" />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-gray-800"
            rows={3}
            placeholder="I'm interested in learning more about this property..."
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Send Message</Button>
      </div>
    </ModalDemo>
  ),
};

export const ConfirmationModal: Story = {
  render: () => (
    <ModalDemo title="Confirm Investment" size="sm">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          You are about to invest <span className="font-semibold text-gray-900 dark:text-white">$25,000</span> in the Oak Park Co-Investment Pool.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          This action cannot be undone.
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button variant="success">Confirm Investment</Button>
      </div>
    </ModalDemo>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <ModalDemo title="Small Modal" size="sm">
        <p>This is a small modal (max-w-sm)</p>
      </ModalDemo>
      <ModalDemo title="Medium Modal" size="md">
        <p>This is a medium modal (max-w-md)</p>
      </ModalDemo>
      <ModalDemo title="Large Modal" size="lg">
        <p>This is a large modal (max-w-lg)</p>
      </ModalDemo>
      <ModalDemo title="Extra Large Modal" size="xl">
        <p>This is an extra large modal (max-w-xl)</p>
      </ModalDemo>
    </div>
  ),
};
