// vite.config.ts
import { defineConfig } from "file:///C:/Users/pc/Desktop/khedma-tn/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/pc/Desktop/khedma-tn/node_modules/@vitejs/plugin-react/dist/index.js";
import { visualizer } from "file:///C:/Users/pc/Desktop/khedma-tn/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "C:\\Users\\pc\\Desktop\\khedma-tn";
var vite_config_default = defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    {
      name: "security-headers",
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://app.posthog.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co wss://localhost:* https://app.posthog.com https://*.sentry.io https://api.flouci.com; frame-ancestors 'none'; upgrade-insecure-requests;");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "DENY");
          res.setHeader("X-XSS-Protection", "1; mode=block");
          res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          next();
        });
      }
    },
    command === "build" && visualizer({ open: false, filename: "dist/stats.html" })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Keep warnings meaningful so bundle growth is noticed early.
    chunkSizeWarningLimit: 700,
    // No source maps in production (saves ~3MB deploy size)
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react") || id.includes("scheduler") || id.includes("react-router")) {
            return "react-vendor";
          }
          if (id.includes("@tanstack/react-query")) {
            return "query-vendor";
          }
          if (id.includes("@supabase/supabase-js")) {
            return "supabase-vendor";
          }
          if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("zod")) {
            return "form-vendor";
          }
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n-vendor";
          }
          if (id.includes("lucide-react") || id.includes("framer-motion")) {
            return "ui-vendor";
          }
          if (id.includes("@sentry") || id.includes("posthog-js")) {
            return "observability-vendor";
          }
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts-vendor";
          }
        }
      }
    },
    // Minify with esbuild — strip console/debugger in production
    minify: "esbuild",
    target: "es2020"
  },
  // Strip debugger statements in production (keep console for error visibility)
  esbuild: mode === "production" ? {
    drop: ["debugger"]
  } : void 0,
  // Performance optimizations
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "lucide-react"
    ]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwY1xcXFxEZXNrdG9wXFxcXGtoZWRtYS10blwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccGNcXFxcRGVza3RvcFxcXFxraGVkbWEtdG5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3BjL0Rlc2t0b3Ava2hlZG1hLXRuL3ZpdGUuY29uZmlnLnRzXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQsIG1vZGUgfSkgPT4gKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAge1xuICAgICAgbmFtZTogJ3NlY3VyaXR5LWhlYWRlcnMnLFxuICAgICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKChfcmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVNlY3VyaXR5LVBvbGljeScsIFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovLyouc3VwYWJhc2UuY28gaHR0cHM6Ly9hcHAucG9zdGhvZy5jb20gaHR0cHM6Ly8qLnNlbnRyeS5pbzsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbTsgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6IGJsb2I6OyBmb250LXNyYyAnc2VsZicgZGF0YTogaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTsgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOi8vKi5zdXBhYmFzZS5jbyB3c3M6Ly8qLnN1cGFiYXNlLmNvIHdzczovL2xvY2FsaG9zdDoqIGh0dHBzOi8vYXBwLnBvc3Rob2cuY29tIGh0dHBzOi8vKi5zZW50cnkuaW8gaHR0cHM6Ly9hcGkuZmxvdWNpLmNvbTsgZnJhbWUtYW5jZXN0b3JzICdub25lJzsgdXBncmFkZS1pbnNlY3VyZS1yZXF1ZXN0cztcIik7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignWC1Db250ZW50LVR5cGUtT3B0aW9ucycsICdub3NuaWZmJyk7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignWC1GcmFtZS1PcHRpb25zJywgJ0RFTlknKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdYLVhTUy1Qcm90ZWN0aW9uJywgJzE7IG1vZGU9YmxvY2snKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdTdHJpY3QtVHJhbnNwb3J0LVNlY3VyaXR5JywgJ21heC1hZ2U9MzE1MzYwMDA7IGluY2x1ZGVTdWJEb21haW5zOyBwcmVsb2FkJyk7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignUmVmZXJyZXItUG9saWN5JywgJ3N0cmljdC1vcmlnaW4td2hlbi1jcm9zcy1vcmlnaW4nKTtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgY29tbWFuZCA9PT0gJ2J1aWxkJyAmJiB2aXN1YWxpemVyKHsgb3BlbjogZmFsc2UsIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyB9KVxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gS2VlcCB3YXJuaW5ncyBtZWFuaW5nZnVsIHNvIGJ1bmRsZSBncm93dGggaXMgbm90aWNlZCBlYXJseS5cbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDcwMCxcblxuICAgIC8vIE5vIHNvdXJjZSBtYXBzIGluIHByb2R1Y3Rpb24gKHNhdmVzIH4zTUIgZGVwbG95IHNpemUpXG4gICAgc291cmNlbWFwOiBmYWxzZSxcblxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgICBpZiAoIWlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkgcmV0dXJuO1xuXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpIHx8IGlkLmluY2x1ZGVzKCdzY2hlZHVsZXInKSB8fCBpZC5pbmNsdWRlcygncmVhY3Qtcm91dGVyJykpIHtcbiAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3F1ZXJ5LXZlbmRvcic7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnKSkge1xuICAgICAgICAgICAgcmV0dXJuICdzdXBhYmFzZS12ZW5kb3InO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtaG9vay1mb3JtJykgfHwgaWQuaW5jbHVkZXMoJ0Bob29rZm9ybS9yZXNvbHZlcnMnKSB8fCBpZC5pbmNsdWRlcygnem9kJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnZm9ybS12ZW5kb3InO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnaTE4bmV4dCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1pMThuZXh0JykpIHtcbiAgICAgICAgICAgIHJldHVybiAnaTE4bi12ZW5kb3InO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ2ZyYW1lci1tb3Rpb24nKSkge1xuICAgICAgICAgICAgcmV0dXJuICd1aS12ZW5kb3InO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHNlbnRyeScpIHx8IGlkLmluY2x1ZGVzKCdwb3N0aG9nLWpzJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnb2JzZXJ2YWJpbGl0eS12ZW5kb3InO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVjaGFydHMnKSB8fCBpZC5pbmNsdWRlcygnZDMtJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnY2hhcnRzLXZlbmRvcic7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgLy8gTWluaWZ5IHdpdGggZXNidWlsZCBcdTIwMTQgc3RyaXAgY29uc29sZS9kZWJ1Z2dlciBpbiBwcm9kdWN0aW9uXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgfSxcblxuICAvLyBTdHJpcCBkZWJ1Z2dlciBzdGF0ZW1lbnRzIGluIHByb2R1Y3Rpb24gKGtlZXAgY29uc29sZSBmb3IgZXJyb3IgdmlzaWJpbGl0eSlcbiAgZXNidWlsZDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8ge1xuICAgIGRyb3A6IFsnZGVidWdnZXInXSxcbiAgfSA6IHVuZGVmaW5lZCxcblxuICAvLyBQZXJmb3JtYW5jZSBvcHRpbWl6YXRpb25zXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnLFxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsXG4gICAgXSxcbiAgfSxcbn0pKVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixTQUFTLGtCQUFrQjtBQUMzQixZQUFZLFVBQVU7QUFKdEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxTQUFTLEtBQUssT0FBTztBQUFBLEVBQ2xELFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixnQkFBZ0IsUUFBUTtBQUN0QixlQUFPLFlBQVksSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTO0FBQzFDLGNBQUksVUFBVSwyQkFBMkIsaWVBQWllO0FBQzFnQixjQUFJLFVBQVUsMEJBQTBCLFNBQVM7QUFDakQsY0FBSSxVQUFVLG1CQUFtQixNQUFNO0FBQ3ZDLGNBQUksVUFBVSxvQkFBb0IsZUFBZTtBQUNqRCxjQUFJLFVBQVUsNkJBQTZCLDhDQUE4QztBQUN6RixjQUFJLFVBQVUsbUJBQW1CLGlDQUFpQztBQUNsRSxlQUFLO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxJQUNBLFlBQVksV0FBVyxXQUFXLEVBQUUsTUFBTSxPQUFPLFVBQVUsa0JBQWtCLENBQUM7QUFBQSxFQUNoRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBVSxhQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsdUJBQXVCO0FBQUE7QUFBQSxJQUd2QixXQUFXO0FBQUEsSUFFWCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixhQUFhLElBQUk7QUFDZixjQUFJLENBQUMsR0FBRyxTQUFTLGNBQWMsRUFBRztBQUVsQyxjQUFJLEdBQUcsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQ25GLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLHVCQUF1QixHQUFHO0FBQ3hDLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLHVCQUF1QixHQUFHO0FBQ3hDLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLGlCQUFpQixLQUFLLEdBQUcsU0FBUyxxQkFBcUIsS0FBSyxHQUFHLFNBQVMsS0FBSyxHQUFHO0FBQzlGLG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLFNBQVMsS0FBSyxHQUFHLFNBQVMsZUFBZSxHQUFHO0FBQzFELG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLGNBQWMsS0FBSyxHQUFHLFNBQVMsZUFBZSxHQUFHO0FBQy9ELG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLFNBQVMsS0FBSyxHQUFHLFNBQVMsWUFBWSxHQUFHO0FBQ3ZELG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksR0FBRyxTQUFTLFVBQVUsS0FBSyxHQUFHLFNBQVMsS0FBSyxHQUFHO0FBQ2pELG1CQUFPO0FBQUEsVUFDVDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsRUFDVjtBQUFBO0FBQUEsRUFHQSxTQUFTLFNBQVMsZUFBZTtBQUFBLElBQy9CLE1BQU0sQ0FBQyxVQUFVO0FBQUEsRUFDbkIsSUFBSTtBQUFBO0FBQUEsRUFHSixjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
