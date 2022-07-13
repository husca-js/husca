import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      enabled: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      all: true,
      reporter: ['text-summary', 'html', 'lcovonly'],
      include: ['src/**/*.ts'],
    },
    include: ['test/**/*.test.ts'],
    watch: false,
  },
});
