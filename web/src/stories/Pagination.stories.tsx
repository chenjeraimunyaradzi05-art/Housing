import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination, PaginationInfo, PaginationWithInfo } from '@/components/ui/Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// Interactive wrapper for controlled state
const PaginationDemo = (props: React.ComponentProps<typeof Pagination>) => {
  const [page, setPage] = useState(props.currentPage);
  return <Pagination {...props} currentPage={page} onPageChange={setPage} />;
};

export const Default: Story = {
  render: () => <PaginationDemo currentPage={1} totalPages={10} onPageChange={() => {}} />,
};

export const ManyPages: Story = {
  render: () => <PaginationDemo currentPage={50} totalPages={100} onPageChange={() => {}} />,
};

export const FewPages: Story = {
  render: () => <PaginationDemo currentPage={2} totalPages={5} onPageChange={() => {}} />,
};

export const SinglePage: Story = {
  render: () => <PaginationDemo currentPage={1} totalPages={1} onPageChange={() => {}} />,
};

export const WithFirstLast: Story = {
  render: () => (
    <PaginationDemo
      currentPage={25}
      totalPages={50}
      showFirstLast
      onPageChange={() => {}}
    />
  ),
};

export const SizeSmall: Story = {
  render: () => (
    <PaginationDemo
      currentPage={5}
      totalPages={10}
      size="sm"
      onPageChange={() => {}}
    />
  ),
};

export const SizeLarge: Story = {
  render: () => (
    <PaginationDemo
      currentPage={5}
      totalPages={10}
      size="lg"
      onPageChange={() => {}}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <PaginationDemo
      currentPage={5}
      totalPages={10}
      disabled
      onPageChange={() => {}}
    />
  ),
};

export const InfoOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <PaginationInfo
        currentPage={1}
        totalPages={10}
        totalItems={245}
        itemsPerPage={25}
      />
      <PaginationInfo
        currentPage={5}
        totalPages={10}
        totalItems={245}
        itemsPerPage={25}
      />
      <PaginationInfo
        currentPage={10}
        totalPages={10}
        totalItems={245}
        itemsPerPage={25}
      />
    </div>
  ),
};

const PaginationWithInfoDemo = () => {
  const [page, setPage] = useState(1);
  return (
    <PaginationWithInfo
      currentPage={page}
      totalPages={10}
      totalItems={245}
      itemsPerPage={25}
      onPageChange={setPage}
    />
  );
};

export const WithInfo: Story = {
  render: () => <PaginationWithInfoDemo />,
};

const FullExampleDemo = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = 156;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Investment Properties</h3>
        <span className="text-sm text-gray-500">{totalItems} total properties</span>
      </div>

      {/* Simulated table */}
      <div className="border rounded divide-y">
        {Array.from({ length: itemsPerPage }, (_, i) => {
          const itemNumber = (page - 1) * itemsPerPage + i + 1;
          if (itemNumber > totalItems) return null;
          return (
            <div key={i} className="p-3 flex items-center justify-between">
              <span>Property #{itemNumber}</span>
              <span className="text-gray-500">$125,000</span>
            </div>
          );
        })}
      </div>

      <PaginationWithInfo
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setPage}
        showFirstLast
      />
    </div>
  );
};

export const FullExample: Story = {
  render: () => <FullExampleDemo />,
};
