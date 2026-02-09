import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '@/components/ui/Alert';

const meta: Meta<typeof Alert> = {
  title: 'VÖR Design System/Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alert component for displaying important messages with different severity levels.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[450px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'New Feature Available',
    children: 'We\'ve added co-investment tracking to your dashboard. Check it out!',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Payment Successful',
    children: 'Your investment of $25,000 has been confirmed.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Document Expiring Soon',
    children: 'Your pre-approval letter expires in 15 days. Please renew it to continue viewing properties.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Transaction Failed',
    children: 'We couldn\'t process your payment. Please check your payment method and try again.',
  },
};

export const WithCloseButton: Story = {
  args: {
    variant: 'info',
    title: 'Closeable Alert',
    children: 'Click the X to close this alert.',
    onClose: () => console.log('Alert closed'),
  },
};

export const WithoutTitle: Story = {
  args: {
    variant: 'success',
    children: 'Your profile has been updated successfully.',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" title="Information">
        This is an informational message.
      </Alert>
      <Alert variant="success" title="Success">
        Operation completed successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        Please review before proceeding.
      </Alert>
      <Alert variant="error" title="Error">
        Something went wrong. Please try again.
      </Alert>
    </div>
  ),
};

export const RealWorldExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" title="Welcome to VÖR" onClose={() => {}}>
        Complete your profile to unlock personalized property recommendations.
      </Alert>
      <Alert variant="success" title="Investment Confirmed">
        You&apos;ve successfully joined the Oak Park Co-Investment Pool. Expected returns: 8-12% annually.
      </Alert>
      <Alert variant="warning" title="Verification Required">
        Please verify your identity to access investment features. This typically takes 1-2 business days.
      </Alert>
      <Alert variant="error" title="Connection Issue">
        We&apos;re having trouble connecting to your bank. Please re-link your account.
      </Alert>
    </div>
  ),
};
