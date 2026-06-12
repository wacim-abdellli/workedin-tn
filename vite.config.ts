
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import * as path from 'path';

const PRODUCTION_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co https://app.posthog.com https://*.sentry.io; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://app.posthog.com https://*.sentry.io wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; media-src 'self' blob:; object-src 'none'; upgrade-insecure-requests;";
const DEVELOPMENT_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://app.posthog.com https://*.sentry.io; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://app.posthog.com https://*.sentry.io ws://localhost:* wss://localhost:* wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; media-src 'self' blob:; object-src 'none';";
const BASE_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
};

function applySecurityHeaders(res: { setHeader: (name: string, value: string) => void }, csp: string, includeHsts: boolean) {
  res.setHeader('Content-Security-Policy', csp);

  for (const [headerName, headerValue] of Object.entries(BASE_SECURITY_HEADERS)) {
    res.setHeader(headerName, headerValue);
  }

  if (includeHsts) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          applySecurityHeaders(res, DEVELOPMENT_CSP, false);
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((_req, res, next) => {
          applySecurityHeaders(res, PRODUCTION_CSP, true);
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

          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          if (id.includes('react') || id.includes('scheduler') || id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
            return 'react-vendor';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          if (id.includes('@radix-ui')) {
            return 'radix-vendor';
          }

          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'date-vendor';
          }

          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor';
          }

          if (id.includes('lucide-react') || id.includes('framer-motion')) {
            return 'ui-vendor';
          }

          if (id.includes('@tanstack/react-virtual')) {
            return 'virtual-vendor';
          }

          if (id.includes('@sentry')) {
            return 'sentry-vendor';
          }

          if (id.includes('posthog-js')) {
            return 'analytics-vendor';
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
      'framer-motion',
      '@tanstack/react-query',
    ],
  },

  test: {
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'design-system/scripts/**/*.test.js',
    ],
    exclude: [
      '**/node_modules/**',
      'dist/**',
      'coverage/**',
      'design-system/docs/**',
    ],
  },
}))
