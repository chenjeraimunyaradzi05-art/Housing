import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f0f0f' },
        { name: 'rose', value: '#fff1f2' },
        { name: 'lavender', value: '#faf5ff' },
      ],
    },
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.backgrounds?.value === '#0f0f0f';
      return (
        <div className={isDark ? 'dark' : ''} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
