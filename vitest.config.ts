import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      enabled: true,
      lines: 98,
      functions: 98,
      branches: 98,
      statements: 98,
      all: true,
      reporter: ['text-summary', 'html', 'lcovonly'],
      include: ['src/**/*.ts'],
    },
    include: ['test/**/*.test.ts'],
    watch: false,
  },
});
