
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import * as path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://app.posthog.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co wss://localhost:* https://app.posthog.com https://*.sentry.io https://api.flouci.com; frame-ancestors 'none'; upgrade-insecure-requests;");
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          next();
        });
      }
    },
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

          if (id.includes('recharts') || id.includes('d3-')) {
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
