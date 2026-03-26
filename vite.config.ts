
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
    // Keep warnings meaningful so bundle growth is noticed early.
    chunkSizeWarningLimit: 700,

    // No source maps in production (saves ~3MB deploy size)
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('scheduler') || id.includes('react-router')) {
            return 'react-vendor';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
            return 'form-vendor';
          }

          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor';
          }

          if (id.includes('lucide-react') || id.includes('framer-motion')) {
            return 'ui-vendor';
          }

          if (id.includes('@sentry') || id.includes('posthog-js')) {
            return 'observability-vendor';
          }

          if (id.includes('recharts')) {
            return 'charts-vendor';
          }
        },
      },
    },

    // Minify with esbuild — strip console/debugger in production
    minify: 'esbuild',
    target: 'es2020',
  },

  // Strip debugger statements in production (keep console for error visibility)
  esbuild: mode === 'production' ? {
    drop: ['debugger'],
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
