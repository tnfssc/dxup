import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true,
  presets: ['@pandacss/preset-base', '@park-ui/panda-preset'],
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
      },
    },
  },
});
