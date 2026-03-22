// @ts-nocheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import * as path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    command === 'build' && visualizer({ open: false, filename: 'dist/stats.html' })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // No source maps in production (saves ~3MB deploy size)
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],
          // UI libraries
          'ui-vendor': ['lucide-react'],
          // Form handling
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },

    // Minify with esbuild — strip console/debugger in production
    minify: 'esbuild',
    target: 'es2020',
  },

  // Strip console.log and debugger statements in production
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
  } : undefined,

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },
}))
