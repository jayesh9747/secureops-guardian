import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@guardian/fixture-mcp/fixtures': fileURLToPath(
        new URL('./packages/fixture-mcp/src/fixtures.ts', import.meta.url),
      ),
      '@guardian/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      '@guardian/policy-verifier': fileURLToPath(
        new URL('./packages/policy-verifier/src/index.ts', import.meta.url),
      ),
      '@guardian/github-write': fileURLToPath(
        new URL('./packages/github-write/src/index.ts', import.meta.url),
      ),
      '@guardian/investigation': fileURLToPath(
        new URL('./packages/investigation/src/index.ts', import.meta.url),
      ),
      '@guardian/reliability': fileURLToPath(
        new URL('./packages/reliability/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
  },
});
