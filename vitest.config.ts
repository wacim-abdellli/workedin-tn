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
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', '.git'],
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
            ],
            thresholds: {
                statements: 20,
                branches: 15,
                functions: 20,
                lines: 20,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        reporters: ['verbose'],
        // Vitest 4+ uses top-level pool config
        pool: 'threads',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
