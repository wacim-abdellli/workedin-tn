# Loading and Empty State Components

This document describes the loading state and empty state components that are part of the design system.

## Components

### 1. Spinner

A circular loading spinner that uses design system animation tokens.

**Props:**
- `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` - Size of the spinner (default: 'md')
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { Spinner } from '@/components/ui';

<Spinner size="md" />
```

**Design Tokens Used:**
- `--color-border-default` - Border color
- `--color-brand-primary` - Active border color
- `--animation-duration-slower` - Animation duration
- `--animation-easing-linear` - Animation timing function

---

### 2. Skeleton

A placeholder component for content that is loading. Supports multiple variants and animations.

**Props:**
- `variant?: 'text' | 'circular' | 'rectangular'` - Shape of the skeleton (default: 'text')
- `width?: string | number` - Width of the skeleton
- `height?: string | number` - Height of the skeleton
- `className?: string` - Additional CSS classes
- `animation?: 'pulse' | 'wave' | 'none'` - Animation type (default: 'pulse')

**Usage:**
```tsx
import { Skeleton } from '@/components/ui';

// Text skeleton
<Skeleton variant="text" width="200px" />

// Avatar skeleton
<Skeleton variant="circular" width="48px" height="48px" />

// Card skeleton
<Skeleton variant="rectangular" width="100%" height="120px" />
```

**Design Tokens Used:**
- `--color-background-muted` - Background color
- `--radius-md` - Border radius

---

### 3. SkeletonGroup

A container for multiple skeleton components with consistent spacing.

**Props:**
- `count?: number` - Number of skeletons to render (default: 3)
- `spacing?: number` - Gap between skeletons in pixels (default: 8)
- `children?: React.ReactNode` - Custom skeleton components
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { SkeletonGroup, Skeleton } from '@/components/ui';

// Auto-generate skeletons
<SkeletonGroup count={5} spacing={12} />

// Custom skeletons
<SkeletonGroup spacing={16}>
  <Skeleton width="100%" />
  <Skeleton width="80%" />
  <Skeleton width="60%" />
</SkeletonGroup>
```

---

### 4. ProgressBar

A progress bar component for showing determinate progress.

**Props:**
- `value: number` - Current progress value (0-100)
- `max?: number` - Maximum value (default: 100)
- `size?: 'sm' | 'md' | 'lg'` - Size of the progress bar (default: 'md')
- `variant?: 'default' | 'success' | 'warning' | 'error'` - Color variant (default: 'default')
- `showLabel?: boolean` - Show percentage label (default: false)
- `label?: string` - Custom label text
- `className?: string` - Additional CSS classes
- `animated?: boolean` - Enable smooth transitions (default: true)

**Usage:**
```tsx
import { ProgressBar } from '@/components/ui';

// Basic progress
<ProgressBar value={50} />

// With label
<ProgressBar value={75} showLabel />

// Custom label
<ProgressBar value={60} showLabel label="Uploading files..." />

// Success variant
<ProgressBar value={100} variant="success" showLabel />
```

**Design Tokens Used:**
- `--color-background-muted` - Track background
- `--color-brand-primary` - Default progress color
- `--color-status-success` - Success variant color
- `--color-status-warning` - Warning variant color
- `--color-status-error` - Error variant color
- `--radius-full` - Border radius
- `--animation-duration-normal` - Transition duration
- `--animation-easing-ease-out` - Transition timing function

---

### 5. IndeterminateProgress

A progress bar for showing indeterminate/unknown progress.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Size of the progress bar (default: 'md')
- `variant?: 'default' | 'success' | 'warning' | 'error'` - Color variant (default: 'default')
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { IndeterminateProgress } from '@/components/ui';

<IndeterminateProgress />
<IndeterminateProgress size="lg" variant="success" />
```

**Design Tokens Used:**
- Same as ProgressBar
- Uses `animate-progress-indeterminate` Tailwind animation

---

### 6. EmptyState

A component for displaying empty states with optional actions. Supports both default and error variants.

**Props:**
- `icon: LucideIcon` - Icon component from lucide-react
- `title: string` - Title text
- `description: string` - Description text
- `variant?: 'default' | 'error'` - Visual variant (default: 'default')
- `action?: object` - Primary action button
  - `label: string` - Button label
  - `onClick: () => void` - Click handler
  - `variant?: ButtonVariant` - Button variant
- `secondaryAction?: object` - Secondary action button (same structure as action)
- `illustration?: React.ReactNode` - Custom illustration (replaces default icon)
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { EmptyState } from '@/components/ui';
import { FileQuestion, AlertCircle } from 'lucide-react';

// Basic empty state
<EmptyState
  icon={FileQuestion}
  title="No items found"
  description="There are no items to display."
/>

// With action
<EmptyState
  icon={FileQuestion}
  title="No projects yet"
  description="Get started by creating your first project."
  action={{
    label: 'Create Project',
    onClick: handleCreate,
  }}
/>

// Error state
<EmptyState
  icon={AlertCircle}
  title="Something went wrong"
  description="We couldn't load your data. Please try again."
  variant="error"
  action={{
    label: 'Retry',
    onClick: handleRetry,
  }}
/>
```

**Design Tokens Used:**
- `--color-brand-primary` / `--color-status-error` - Icon and accent color
- `--color-brand-primary-light` / `--red-50` - Background gradient
- `--color-border-subtle` - Border color
- `--color-background-elevated` - Icon container background
- `--color-text-primary` - Title color
- `--color-text-secondary` - Description color
- `--font-fontFamily-heading` - Title font family
- `--font-fontWeight-semibold` - Title font weight
- `--font-fontSize-base` - Description font size
- `--font-lineHeight-relaxed` - Description line height
- `--radius-lg` - Border radius
- `--shadow-elevation-1` / `--shadow-elevation-2` - Box shadows

---

## Animation Tokens

The components use the following animation tokens from the design system:

- `--animation-duration-instant`: 0ms
- `--animation-duration-fast`: 150ms
- `--animation-duration-normal`: 250ms
- `--animation-duration-slow`: 350ms
- `--animation-duration-slower`: 500ms
- `--animation-easing-linear`: linear
- `--animation-easing-ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `--animation-easing-ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `--animation-easing-ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)

---

## Accessibility

All components follow accessibility best practices:

- **Spinner**: Uses `role="status"` and `aria-label="Loading"` with screen reader text
- **Skeleton**: Uses `role="status"` and `aria-label="Loading content"` with screen reader text
- **ProgressBar**: Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`
- **IndeterminateProgress**: Uses `role="progressbar"` with `aria-label` and `aria-busy="true"`
- **EmptyState**: Uses semantic HTML with proper heading hierarchy and accessible button components

---

## Examples

See `LoadingStates.example.tsx` for comprehensive usage examples of all components.

---

## Requirements Satisfied

This implementation satisfies the following requirements from the design system specification:

- **Requirement 16.1**: Loading state patterns (Spinner, Skeleton, ProgressBar)
- **Requirement 16.2**: Empty state designs with illustrations and messaging
- **Requirement 16.3**: Guidelines for when to use each loading pattern
- **Requirement 16.4**: Error state designs for failed loads

All components use design system tokens for colors, spacing, typography, and animations, ensuring consistency across the application.
