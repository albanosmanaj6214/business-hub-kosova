import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Separate config for DB-backed persistence tests (*.pgtest.ts). These are NOT
// part of the default `npm run test` glob (src/**/*.test.ts) so the normal suite
// never depends on a database. Run with an isolated DATABASE_URL only.
export default defineConfig({
  test: {
    include: ['src/**/*.pgtest.ts'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
