import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

const meta: Meta = {
  title: 'VÖR Design System/Components/Toast',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast notifications for temporary feedback messages.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const SuccessToastDemo = () => {
  const { success } = useToast();

  return (
    <Button
      variant="success"
      onClick={() => success('Investment Confirmed', 'Your $25,000 investment has been processed successfully.')}
    >
      Show Success Toast
    </Button>
  );
};

export const Success: Story = {
  render: () => <SuccessToastDemo />,
};

const ErrorToastDemo = () => {
  const { error } = useToast();

  return (
    <Button
      variant="danger"
      onClick={() => error('Transaction Failed', 'We couldn\'t process your payment. Please try again.')}
    >
      Show Error Toast
    </Button>
  );
};

export const Error: Story = {
  render: () => <ErrorToastDemo />,
};

const WarningToastDemo = () => {
  const { warning } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => warning('Session Expiring', 'Your session will expire in 5 minutes.')}
    >
      Show Warning Toast
    </Button>
  );
};

export const Warning: Story = {
  render: () => <WarningToastDemo />,
};

const InfoToastDemo = () => {
  const { info } = useToast();

  return (
    <Button
      variant="primary"
      onClick={() => info('New Property Added', 'A new property matching your criteria has been listed.')}
    >
      Show Info Toast
    </Button>
  );
};

export const Info: Story = {
  render: () => <InfoToastDemo />,
};

const AllVariantsDemo = () => {
  const { success, error, warning, info } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="success"
        onClick={() => success('Success!', 'Your action was completed successfully.')}
      >
        Success
      </Button>
      <Button
        variant="danger"
        onClick={() => error('Error!', 'Something went wrong. Please try again.')}
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => warning('Warning!', 'Please review before proceeding.')}
      >
        Warning
      </Button>
      <Button
        variant="primary"
        onClick={() => info('Info', 'Here is some helpful information.')}
      >
        Info
      </Button>
    </div>
  );
};

export const AllVariants: Story = {
  render: () => <AllVariantsDemo />,
};

const MultipleToastsDemo = () => {
  const { success, info } = useToast();

  const showMultiple = () => {
    success('Property Saved', 'Added to your favorites list.');
    setTimeout(() => info('Tip', 'You can view all saved properties in your dashboard.'), 500);
    setTimeout(() => success('Synced', 'Your preferences have been updated.'), 1000);
  };

  return (
    <Button variant="primary" onClick={showMultiple}>
      Show Multiple Toasts
    </Button>
  );
};

export const MultipleToasts: Story = {
  render: () => <MultipleToastsDemo />,
};

const RealWorldExamplesDemo = () => {
  const { success, error, warning, info } = useToast();

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="font-semibold text-lg">Investment Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => success('Investment Complete', 'You\'ve joined the Oak Park property pool.')}
        >
          Complete Investment
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => error('Payment Declined', 'Your bank declined the transaction.')}
        >
          Payment Failed
        </Button>
      </div>

      <h3 className="font-semibold text-lg mt-6">Account Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => info('Welcome Back', 'You have 3 new property recommendations.')}
        >
          Login
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => warning('Verify Email', 'Please verify your email to unlock all features.')}
        >
          Reminder
        </Button>
      </div>

      <h3 className="font-semibold text-lg mt-6">Document Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => success('Document Uploaded', 'Pre-approval letter has been submitted.')}
        >
          Upload Document
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => warning('Document Expiring', 'Your pre-approval expires in 7 days.')}
        >
          Expiry Warning
        </Button>
      </div>
    </div>
  );
};

export const RealWorldExamples: Story = {
  render: () => <RealWorldExamplesDemo />,
};
