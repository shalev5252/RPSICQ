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
        include: ['src/__tests__/**/*.test.ts'],
        exclude: ['src/__tests__/integration/**'],
        testTimeout: 10000,
    },
});
