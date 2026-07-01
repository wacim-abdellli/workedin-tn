/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: [
            'src/**/*.{test,spec}.{ts,tsx}',
            'design-system/build/**/*.test.js',
            'design-system/scripts/**/*.test.js',
        ],
        exclude: ['**/node_modules/**', 'dist', '.git', 'design-system/docs/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.test.{ts,tsx}',
                'src/**/*.spec.{ts,tsx}',
                'src/test/**/*',
                'src/main.tsx',
                'src/vite-env.d.ts',
                'src/types/**/*',
            ],
            thresholds: {
                statements: 23,
                branches: 18,
                functions: 19,
                lines: 23,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        reporters: ['verbose'],
        pool: 'threads',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
