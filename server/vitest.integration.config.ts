import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@rps/shared': path.resolve(__dirname, '../shared/src'),
        },
    },
    test: {
        globals: true,
        include: ['src/__tests__/integration/**/*.test.ts'],
        testTimeout: 30000,
        hookTimeout: 15000,
    },
});
