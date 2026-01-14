import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    // environmentOptions might be needed for R2 bindings, but for unit tests with mocks it's fine
  },
});
