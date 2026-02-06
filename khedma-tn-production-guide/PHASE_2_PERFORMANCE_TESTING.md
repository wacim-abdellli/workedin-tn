# PHASE 2: PERFORMANCE TESTING & OPTIMIZATION

## 🎯 Objective
Measure and optimize application performance for production readiness.

---

## PART 1: PERFORMANCE METRICS COLLECTION

### Setup Tools

#### Install Lighthouse CI
```bash
npm install -g @lhci/cli
```

#### Create Lighthouse Config
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
};
```

### Run Performance Tests

#### Test 1: Homepage Performance
```bash
# Start dev server
npm run dev

# In another terminal, run Lighthouse
lighthouse http://localhost:5173 --view --preset=desktop
```

**Target Metrics:**
- Performance Score: > 90
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Blocking Time (TBT): < 300ms
- Cumulative Layout Shift (CLS): < 0.1

#### Test 2: Dashboard Performance
```bash
# Login first, then test
lighthouse http://localhost:5173/freelancer/dashboard --view
```

**Expected:**
- Performance: > 85 (lower due to auth/data)
- No console errors
- No memory leaks

#### Test 3: Job Board Performance
```bash
lighthouse http://localhost:5173/jobs --view
```

**Check:**
- Lazy loading works
- Infinite scroll doesn't block
- Filter performance

---

## PART 2: BUNDLE SIZE ANALYSIS

### Analyze Production Build

```bash
# Build for production
npm run build

# Check bundle sizes
npx vite-bundle-visualizer
```

### Expected Output
```
File                      Size       Gzipped
dist/index.html          ~2 KB      ~1 KB
dist/assets/index.js     ~400 KB    ~120 KB
dist/assets/vendor.js    ~300 KB    ~90 KB
dist/assets/react.js     ~150 KB    ~45 KB
```

### Optimization Targets

#### Target 1: Main Bundle < 500KB
If main bundle > 500KB:

**FILE: vite.config.ts**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'ui-vendor': ['lucide-react'],
          
          // Split large pages
          'admin-pages': [
            './src/pages/AdminDashboard',
            './src/pages/admin/VerificationQueue',
          ],
          'freelancer-pages': [
            './src/pages/FreelancerDashboard',
            './src/pages/FreelancerProfile',
          ],
        },
      },
    },
  },
});
```

#### Target 2: Remove Unused Dependencies

```bash
# Check for unused dependencies
npx depcheck

# Remove if found
npm uninstall <package-name>
```

#### Target 3: Optimize Images

**Check all images in src/assets/**
```bash
# Install image optimizer
npm install -D vite-plugin-imagemin

# Add to vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

plugins: [
  react(),
  viteImagemin({
    gifsicle: { optimizationLevel: 7 },
    optipng: { optimizationLevel: 7 },
    mozjpeg: { quality: 80 },
    webp: { quality: 80 },
  }),
],
```

---

## PART 3: RUNTIME PERFORMANCE

### Test 1: Memory Leaks

**Instructions:**
1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Navigate through app (signup → onboarding → dashboard → jobs)
4. Return to homepage
5. Force garbage collection (DevTools → Performance → Collect garbage icon)
6. Take another heap snapshot
7. Compare snapshots

**Expected:**
- Detached DOM nodes: < 10
- Memory increase: < 20MB
- No listeners attached to destroyed components

### Test 2: React Performance

**Install React DevTools Profiler:**
1. Install React DevTools extension
2. Open app
3. Start profiling
4. Perform common actions (navigate, submit form, load data)
5. Stop profiling

**Check for:**
- ✅ No unnecessary re-renders
- ✅ Expensive components memoized
- ✅ List items use React.memo
- ✅ Virtual scrolling for long lists (if needed)

**Fix Unnecessary Re-renders:**

If you find components re-rendering unnecessarily:

```typescript
// Add React.memo
import { memo } from 'react';

function ExpensiveComponent({ data }) {
  // component code
}

export default memo(ExpensiveComponent);

// Add useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Add useCallback for event handlers passed to children
const handleClick = useCallback(() => {
  // handle click
}, []);
```

### Test 3: Database Query Performance

**Check Slow Queries:**

```sql
-- In Supabase Dashboard → SQL Editor
-- Enable query logging (if not already)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Optimize Slow Queries:**

Common fixes:
1. Add missing indexes
2. Reduce JOIN complexity
3. Use `select('specific,columns')` instead of `select('*')`
4. Add pagination to large lists

**Example Optimization:**

Before:
```typescript
const { data } = await supabase
  .from('proposals')
  .select('*, freelancer:profiles(*), job:jobs(*)')
  .eq('job_id', jobId);
```

After:
```typescript
const { data } = await supabase
  .from('proposals')
  .select(`
    id,
    bid_amount,
    cover_letter,
    freelancer:profiles!freelancer_id(id, full_name, avatar_url),
    job:jobs!job_id(id, title)
  `)
  .eq('job_id', jobId)
  .order('created_at', { ascending: false });
```

---

## PART 4: NETWORK PERFORMANCE

### Test 1: API Call Optimization

**Check Network Tab:**
1. Open DevTools → Network
2. Navigate through app
3. Look for:
   - Duplicate requests
   - Unnecessary requests
   - Large payloads
   - Slow responses

**Common Issues & Fixes:**

#### Issue: Duplicate Requests
```typescript
// Bad: Multiple components fetching same data
useEffect(() => {
  fetchJobs();
}, []);

// Good: Use context or React Query
const { data: jobs } = useQuery('jobs', fetchJobs);
```

#### Issue: Large Payloads
```typescript
// Bad: Fetching everything
.select('*')

// Good: Select only needed fields
.select('id, title, budget, status')
```

#### Issue: No Caching
```typescript
// Add caching headers
const { data } = await supabase
  .from('jobs')
  .select()
  .eq('status', 'open')
  .cache(300); // Cache for 5 minutes (if supported)
```

### Test 2: Real-time Performance

**Test Supabase Realtime:**

```typescript
// In browser console, monitor realtime connection
const subscription = supabase
  .channel('test-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => console.log('Realtime event:', payload)
  )
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// Check:
// ✅ Status should be 'SUBSCRIBED'
// ✅ No disconnections
// ✅ Events arrive < 1s after database change
```

---

## PART 5: OPTIMIZATION CHECKLIST

### Code-Level Optimizations

#### ✅ Implement Code Splitting
```typescript
// Instead of direct imports
import AdminDashboard from './pages/AdminDashboard';

// Use lazy loading
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

#### ✅ Optimize Images
```typescript
// Use OptimizedImage component
import OptimizedImage from '@/components/common/OptimizedImage';

<OptimizedImage
  src="/hero-image.jpg"
  alt="Hero"
  width={1200}
  height={600}
  loading="lazy"
/>
```

#### ✅ Debounce Search Inputs
```typescript
import { useDebounce } from '@/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

#### ✅ Virtual Scrolling for Long Lists
If job board has 100+ items:

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={jobs.length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <JobCard job={jobs[index]} />
    </div>
  )}
</FixedSizeList>
```

### Build-Level Optimizations

#### ✅ Enable Compression
```typescript
// vite.config.ts
import viteCompression from 'vite-plugin-compression';

plugins: [
  react(),
  viteCompression({
    algorithm: 'brotliCompress',
    ext: '.br',
  }),
],
```

#### ✅ Remove Console Logs in Production
Already done via terser config:
```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
},
```

#### ✅ Preload Critical Resources
```html
<!-- In index.html -->
<link rel="preconnect" href="https://YOUR_SUPABASE_URL">
<link rel="preload" href="/logo.svg" as="image">
```

---

## PART 6: PERFORMANCE TESTING SCRIPT

### Automated Performance Test

**FILE: Create scripts/performance-test.js**

```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  const { performance, accessibility } = runnerResult.lhr.categories;
  
  console.log(`
    Performance Score: ${performance.score * 100}
    Accessibility Score: ${accessibility.score * 100}
  `);

  return {
    performance: performance.score * 100,
    accessibility: accessibility.score * 100,
  };
}

async function main() {
  const urls = [
    'http://localhost:5173/',
    'http://localhost:5173/jobs',
    'http://localhost:5173/find-freelancers',
  ];

  for (const url of urls) {
    console.log(`\nTesting: ${url}`);
    const scores = await runLighthouse(url);
    
    if (scores.performance < 90) {
      console.error('❌ Performance score below target!');
      process.exit(1);
    }
  }

  console.log('\n✅ All performance tests passed!');
}

main();
```

**Run:**
```bash
node scripts/performance-test.js
```

---

## 📊 PERFORMANCE REPORT TEMPLATE

```markdown
# Performance Test Results
Date: {{DATE}}
Environment: Development / Production

## Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Home | 95 | 98 | 100 | 100 |
| Jobs | 92 | 97 | 100 | 98 |
| Dashboard | 88 | 96 | 100 | N/A |

## Core Web Vitals

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | 1.2s | < 1.8s | ✅ |
| LCP | 2.1s | < 2.5s | ✅ |
| TTI | 3.2s | < 3.8s | ✅ |
| TBT | 250ms | < 300ms | ✅ |
| CLS | 0.05 | < 0.1 | ✅ |

## Bundle Size

| File | Size | Gzipped | Target | Status |
|------|------|---------|--------|--------|
| Main JS | 420 KB | 125 KB | < 500 KB | ✅ |
| Vendor | 280 KB | 85 KB | < 300 KB | ✅ |
| CSS | 45 KB | 12 KB | < 50 KB | ✅ |

## Issues Found
1. [None] or [List issues]

## Optimizations Applied
1. Code splitting implemented
2. Images optimized
3. Lazy loading enabled
4. Bundle size reduced by 30%

## Pass/Fail
Status: ✅ PASS / ❌ FAIL

Ready for Production: [ ] Yes [ ] No
```

---

## 🚀 Next Steps

After performance optimization:
1. Proceed to PHASE 3: Security Audit
2. Re-run tests after any changes
3. Monitor in production with real users
