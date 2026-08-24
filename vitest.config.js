import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@guardian/fixture-mcp/fixtures': fileURLToPath(
        new URL('./packages/fixture-mcp/src/fixtures.ts', import.meta.url),
      ),
      '@guardian/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
  },
});
