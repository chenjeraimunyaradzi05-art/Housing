import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'VÖR Design System/Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Accordion component for expandable/collapsible content sections.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion type="single">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is VÖR?</AccordionTrigger>
        <AccordionContent>
          VÖR is a women-centered real estate platform designed to help women build generational
          wealth through strategic property investments and co-investment opportunities.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does co-investing work?</AccordionTrigger>
        <AccordionContent>
          Co-investing allows multiple investors to pool their resources to purchase properties
          that might otherwise be out of reach. Each investor owns a proportional share and
          receives returns based on their investment amount.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What are the membership tiers?</AccordionTrigger>
        <AccordionContent>
          We offer Free, Rose, Gold, and Platinum membership tiers. Each tier provides
          different levels of access to properties, investment opportunities, educational
          resources, and personalized support.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const MultipleOpen: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['item-1']}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Property Overview</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <p><strong>Address:</strong> 123 Main Street, Austin, TX</p>
            <p><strong>Type:</strong> Single Family Home</p>
            <p><strong>Size:</strong> 2,450 sq ft</p>
            <p><strong>Year Built:</strong> 2019</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Financial Details</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <p><strong>List Price:</strong> $425,000</p>
            <p><strong>Monthly Rent:</strong> $2,800</p>
            <p><strong>Cap Rate:</strong> 5.2%</p>
            <p><strong>Cash-on-Cash Return:</strong> 8.7%</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Neighborhood Info</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <p><strong>School District:</strong> Austin ISD (Rating: 8/10)</p>
            <p><strong>Walk Score:</strong> 72</p>
            <p><strong>Transit Score:</strong> 58</p>
            <p><strong>Median Home Value:</strong> $385,000</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const FAQ: Story = {
  render: () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single">
        <AccordionItem value="faq-1">
          <AccordionTrigger>How do I get started with VÖR?</AccordionTrigger>
          <AccordionContent>
            Getting started is easy! Create a free account, complete your profile, and
            verify your identity. Once verified, you can browse properties, join co-investment
            pools, and start building your portfolio.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>What is the minimum investment amount?</AccordionTrigger>
          <AccordionContent>
            Minimum investments vary by opportunity. Co-investment pools typically start at
            $5,000, while some premium opportunities may require higher minimums. Check each
            listing for specific requirements.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-3">
          <AccordionTrigger>How are returns distributed?</AccordionTrigger>
          <AccordionContent>
            Returns are distributed proportionally based on your investment share. For rental
            properties, distributions are typically monthly. For appreciation gains from property
            sales, you&apos;ll receive your share when the property is sold.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-4">
          <AccordionTrigger>Is my investment protected?</AccordionTrigger>
          <AccordionContent>
            All investments are backed by real property assets. We conduct thorough due diligence
            on every property and work with trusted partners for property management. However,
            as with any investment, there are risks involved.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-5">
          <AccordionTrigger>Can I sell my investment share?</AccordionTrigger>
          <AccordionContent>
            Yes, through our secondary marketplace, you can list your investment shares for sale
            to other VÖR members. Liquidity depends on market demand, and sales are subject to
            holding period requirements.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const WithDefaultOpen: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>First item (open by default)</AccordionTrigger>
        <AccordionContent>
          This accordion item is expanded by default using the defaultValue prop.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second item</AccordionTrigger>
        <AccordionContent>
          Click to expand this content.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third item</AccordionTrigger>
        <AccordionContent>
          Another collapsible section.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const PropertyDetails: Story = {
  render: () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Property Investment Details</h2>
      <Accordion type="multiple" defaultValue={['overview']}>
        <AccordionItem value="overview">
          <AccordionTrigger>Investment Overview</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This property represents an excellent opportunity for investors looking to
                diversify their portfolio with residential real estate in a growing market.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded">
                  <span className="text-gray-500">Min. Investment</span>
                  <p className="font-semibold text-rose-700 dark:text-rose-300">$10,000</p>
                </div>
                <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded">
                  <span className="text-gray-500">Expected Return</span>
                  <p className="font-semibold text-teal-700 dark:text-teal-300">12.5% IRR</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="documents">
          <AccordionTrigger>Legal Documents</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-rose-500">📄</span>
                Operating Agreement
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-500">📄</span>
                Property Appraisal Report
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-500">📄</span>
                Title Insurance Policy
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-500">📄</span>
                Investment Memorandum
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="timeline">
          <AccordionTrigger>Investment Timeline</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-rose-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Funding Period</p>
                  <p className="text-gray-500">Jan 15 - Feb 28, 2025</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gold-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Property Acquisition</p>
                  <p className="text-gray-500">March 2025</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">First Distribution</p>
                  <p className="text-gray-500">Q2 2025</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
