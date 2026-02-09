import type { Meta, StoryObj } from '@storybook/react';
import { Container, Stack, HStack, VStack, Grid, Box, Divider, Center } from '@/components/ui/Layout';
import { Card, CardContent } from '@/components/ui/Card';

const meta: Meta = {
  title: 'VÖR Design System/Components/Layout',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Layout components for building consistent page structures.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const ContainerSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Container size="sm" className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded">
        <p className="text-center">Small Container (640px)</p>
      </Container>
      <Container size="md" className="bg-lavender-100 dark:bg-lavender-900/30 p-4 rounded">
        <p className="text-center">Medium Container (768px)</p>
      </Container>
      <Container size="lg" className="bg-teal-100 dark:bg-teal-900/30 p-4 rounded">
        <p className="text-center">Large Container (1024px)</p>
      </Container>
      <Container size="xl" className="bg-gold-100 dark:bg-gold-900/30 p-4 rounded">
        <p className="text-center">Extra Large Container (1280px)</p>
      </Container>
    </div>
  ),
};

export const StackVertical: Story = {
  render: () => (
    <VStack spacing="md" className="max-w-sm">
      <div className="w-full p-4 bg-rose-100 dark:bg-rose-900/30 rounded">Item 1</div>
      <div className="w-full p-4 bg-lavender-100 dark:bg-lavender-900/30 rounded">Item 2</div>
      <div className="w-full p-4 bg-teal-100 dark:bg-teal-900/30 rounded">Item 3</div>
    </VStack>
  ),
};

export const StackHorizontal: Story = {
  render: () => (
    <HStack spacing="md" align="center">
      <div className="p-4 bg-rose-100 dark:bg-rose-900/30 rounded">Item 1</div>
      <div className="p-6 bg-lavender-100 dark:bg-lavender-900/30 rounded">Item 2 (Taller)</div>
      <div className="p-4 bg-teal-100 dark:bg-teal-900/30 rounded">Item 3</div>
    </HStack>
  ),
};

export const StackSpacing: Story = {
  render: () => (
    <div className="space-y-6">
      {(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((spacing) => (
        <div key={spacing}>
          <p className="text-sm text-gray-500 mb-2">Spacing: {spacing}</p>
          <HStack spacing={spacing}>
            <div className="w-12 h-12 bg-rose-500 rounded" />
            <div className="w-12 h-12 bg-lavender-500 rounded" />
            <div className="w-12 h-12 bg-teal-500 rounded" />
          </HStack>
        </div>
      ))}
    </div>
  ),
};

export const GridBasic: Story = {
  render: () => (
    <Grid cols={3} gap="md">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-8 bg-rose-100 dark:bg-rose-900/30 rounded text-center">
          {i}
        </div>
      ))}
    </Grid>
  ),
};

export const GridResponsive: Story = {
  render: () => (
    <Grid cols={4} gap="md" responsive>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-rose-500">#{i}</div>
            <p className="text-sm text-gray-500">Grid Item</p>
          </CardContent>
        </Card>
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid automatically adjusts columns on smaller screens when responsive is true.',
      },
    },
  },
};

export const GridAuto: Story = {
  render: () => (
    <Grid cols="auto" gap="md">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-lavender-500">#{i}</div>
            <p className="text-sm text-gray-500">Auto-fit</p>
          </CardContent>
        </Card>
      ))}
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Auto-fit grid adjusts number of columns based on available space.',
      },
    },
  },
};

export const BoxComponent: Story = {
  render: () => (
    <div className="space-y-4">
      <Box p="lg" rounded="lg" bg="primary" shadow="md">
        <p>Box with padding, rounded corners, background, and shadow</p>
      </Box>
      <Box p="md" rounded="md" bg="secondary">
        <p>Secondary background box</p>
      </Box>
      <Box p="md" rounded="md" bg="white" shadow="lg">
        <p>White box with large shadow</p>
      </Box>
    </div>
  ),
};

export const DividerExamples: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <p className="text-sm text-gray-500 mb-2">Horizontal Dividers</p>
        <VStack spacing="md">
          <p>Content above</p>
          <Divider />
          <p>Content below</p>
        </VStack>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Divider with Label</p>
        <VStack spacing="md">
          <p>Section One</p>
          <Divider label="OR" />
          <p>Section Two</p>
        </VStack>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Divider Variants</p>
        <VStack spacing="md">
          <Divider variant="solid" />
          <Divider variant="dashed" />
          <Divider variant="dotted" />
        </VStack>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-2">Vertical Divider</p>
        <HStack spacing="md" className="h-16">
          <div className="flex-1 flex items-center justify-center">Left</div>
          <Divider orientation="vertical" />
          <div className="flex-1 flex items-center justify-center">Right</div>
        </HStack>
      </div>
    </div>
  ),
};

export const CenterComponent: Story = {
  render: () => (
    <Center className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <p className="text-2xl font-bold">Centered Content</p>
        <p className="text-gray-500">Both horizontally and vertically</p>
      </div>
    </Center>
  ),
};

export const RealWorldLayout: Story = {
  render: () => (
    <Container size="lg">
      <VStack spacing="lg">
        {/* Header */}
        <HStack justify="between" align="center" className="w-full py-4">
          <h1 className="text-2xl font-bold">My Properties</h1>
          <HStack spacing="sm">
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded">Filter</div>
            <div className="px-4 py-2 bg-rose-500 text-white rounded">+ Add Property</div>
          </HStack>
        </HStack>

        <Divider />

        {/* Stats Row */}
        <Grid cols={4} gap="md" className="w-full">
          {[
            { label: 'Total Value', value: '$1.2M' },
            { label: 'Properties', value: '4' },
            { label: 'Monthly Income', value: '$8,400' },
            { label: 'ROI', value: '12.5%' },
          ].map((stat) => (
            <Box key={stat.label} p="md" rounded="lg" bg="white" shadow="sm">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </Box>
          ))}
        </Grid>

        {/* Property Grid */}
        <Grid cols={3} gap="md" className="w-full">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="elevated">
              <div className="aspect-video bg-gradient-to-br from-rose-100 to-lavender-100 rounded-t-lg" />
              <CardContent className="p-4">
                <h3 className="font-semibold">Property {i}</h3>
                <p className="text-sm text-gray-500">Austin, TX</p>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </VStack>
    </Container>
  ),
};
