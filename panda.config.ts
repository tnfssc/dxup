import { defineConfig } from '@pandacss/dev';
import { createPreset } from '@park-ui/panda-preset';

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/preset-base', createPreset({ additionalColors: ['*'] })],
  include: ['./**/*.{ts,tsx}'],
  exclude: ['node_modules', '.next', '**/*.test.*', '**/*.spec.*', '**/*.e2e.*', '**/*.config.*'],
  jsxFramework: 'react',
  outdir: 'styled-system',
  strictTokens: true,
  strictPropertyValues: true,
  conditions: {
    extend: {
      dark: '.dark &, [data-theme="dark"] &',
      light: '.light &',
    },
  },
  theme: {
    extend: {
      recipes: {
        button: {
          base: {
            '&:active': {
              transform: 'scale(0.98)',
            },
            transition: 'transform 0.2s ease-in-out',
          },
        },
      },
      tokens: {
        fonts: {
          body: { value: 'Red Hat Text, system-ui, sans-serif' },
          heading: { value: 'Red Hat Display, system-ui, sans-serif' },
          mono: { value: 'Red Hat Mono, system-ui, monospace' },
          code: { value: 'Red Hat Mono, system-ui, monospace' },
        },
        animations: {
          spin: {
            value: 'spin 1s linear infinite',
          },
        },
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
});
