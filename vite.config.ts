// @ts-nocheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import * as path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    command === 'build' && visualizer({ open: true })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging
    sourcemap: true,

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

    // Minify configuration
    minify: 'esbuild',
    target: 'es2020',
  },

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
