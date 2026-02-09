import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker, DateRangePicker } from '@/components/ui/DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'UI/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

// Interactive wrapper for controlled state
const DatePickerDemo = (props: Omit<React.ComponentProps<typeof DatePicker>, 'value' | 'onChange'>) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  return <DatePicker {...props} value={date} onChange={setDate} />;
};

export const Default: Story = {
  render: () => <DatePickerDemo placeholder="Select a date" />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-4">
      <DatePickerDemo label="Start Date" placeholder="Choose start date" />
      <DatePickerDemo label="End Date" placeholder="Choose end date" />
    </div>
  ),
};

export const WithPreselectedDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <DatePicker value={date} onChange={setDate} label="Investment Date" />;
  },
};

export const WithMinMaxDates: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return (
      <DatePicker
        value={date}
        onChange={setDate}
        minDate={minDate}
        maxDate={maxDate}
        label="Select Date (Current Month Only)"
        placeholder="Pick a date this month"
      />
    );
  },
};

export const FutureDatesOnly: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        minDate={new Date()}
        label="Scheduled Payment Date"
        placeholder="Select future date"
      />
    );
  },
};

export const PastDatesOnly: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        maxDate={new Date()}
        label="Date of Birth"
        placeholder="Select your birth date"
      />
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <DatePickerDemo size="sm" label="Small" placeholder="Small picker" />
      <DatePickerDemo size="md" label="Medium (Default)" placeholder="Medium picker" />
      <DatePickerDemo size="lg" label="Large" placeholder="Large picker" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <DatePickerDemo disabled label="Disabled Empty" placeholder="Cannot select" />
      {(() => {
        const [date] = useState<Date | undefined>(new Date());
        return (
          <DatePicker
            value={date}
            onChange={() => {}}
            disabled
            label="Disabled With Value"
          />
        );
      })()}
    </div>
  ),
};

export const CustomFormat: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const formatDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    return (
      <DatePicker
        value={date}
        onChange={setDate}
        formatDate={formatDate}
        label="Custom Format (MMM D, YYYY)"
      />
    );
  },
};

// Date Range Picker Stories
const DateRangePickerDemo = (props: Omit<React.ComponentProps<typeof DateRangePicker>, 'startDate' | 'endDate' | 'onStartDateChange' | 'onEndDateChange'>) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  return (
    <DateRangePicker
      {...props}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
    />
  );
};

export const DateRange: Story = {
  render: () => (
    <DateRangePickerDemo
      startLabel="Check In"
      endLabel="Check Out"
      startPlaceholder="Arrival date"
      endPlaceholder="Departure date"
    />
  ),
};

export const DateRangeWithPreset: Story = {
  render: () => {
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    return (
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        startLabel="Investment Period Start"
        endLabel="Investment Period End"
      />
    );
  },
};

export const DateRangeInline: Story = {
  render: () => (
    <DateRangePickerDemo
      orientation="horizontal"
      startLabel="From"
      endLabel="To"
    />
  ),
};

export const InvestmentDateForm: Story = {
  render: () => {
    const [investmentDate, setInvestmentDate] = useState<Date | undefined>(undefined);
    const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);

    return (
      <div className="max-w-md p-6 border rounded-lg space-y-6">
        <h3 className="text-lg font-semibold">Investment Details</h3>

        <div className="space-y-4">
          <DatePicker
            value={investmentDate}
            onChange={(date) => {
              setInvestmentDate(date);
              // Auto-set maturity to 1 year later
              if (date) {
                const maturity = new Date(date);
                maturity.setFullYear(maturity.getFullYear() + 1);
                setMaturityDate(maturity);
              }
            }}
            label="Investment Date"
            placeholder="When to invest"
            minDate={new Date()}
          />

          <DatePicker
            value={maturityDate}
            onChange={setMaturityDate}
            label="Maturity Date"
            placeholder="Investment maturity"
            minDate={investmentDate || new Date()}
          />
        </div>

        <div className="pt-4 border-t">
          <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Schedule Investment
          </button>
        </div>
      </div>
    );
  },
};
