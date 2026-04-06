# Tailwind Design System Utilities

This document provides a quick reference for using the design system tokens through Tailwind CSS utilities.

## Typography

### Font Families
```html
<!-- Design system fonts -->
<h1 class="font-heading">Heading Text</h1>
<p class="font-body">Body Text</p>
<code class="font-mono">Code Text</code>

<!-- Legacy fonts (still available) -->
<p class="font-sans">DM Sans</p>
<p class="font-display">Outfit</p>
```

### Font Sizes
All font sizes include optimized line heights:
```html
<p class="text-xs">Extra small (12px)</p>
<p class="text-sm">Small (14px)</p>
<p class="text-base">Base (16px)</p>
<p class="text-lg">Large (18px)</p>
<p class="text-xl">Extra large (20px)</p>
<p class="text-2xl">Heading 4 (24px)</p>
<p class="text-3xl">Heading 3 (30px)</p>
<p class="text-4xl">Heading 2 (36px)</p>
<p class="text-5xl">Heading 1 (48px)</p>
<p class="text-6xl">Display (60px)</p>
```

### Font Weights
```html
<p class="font-light">Light (300)</p>
<p class="font-normal">Normal (400)</p>
<p class="font-medium">Medium (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
<p class="font-extrabold">Extrabold (800)</p>
```

### Line Heights
```html
<p class="leading-tight">Tight (1.25) - for headings</p>
<p class="leading-snug">Snug (1.375)</p>
<p class="leading-normal">Normal (1.5) - for body text</p>
<p class="leading-relaxed">Relaxed (1.625)</p>
<p class="leading-loose">Loose (2)</p>
```

### Letter Spacing
```html
<p class="tracking-tighter">Tighter (-0.05em)</p>
<p class="tracking-tight">Tight (-0.025em)</p>
<p class="tracking-normal">Normal (0)</p>
<p class="tracking-wide">Wide (0.025em)</p>
<p class="tracking-wider">Wider (0.05em)</p>
<p class="tracking-widest">Widest (0.1em)</p>
```

## Spacing

Use consistent spacing values for margins, padding, and gaps:

```html
<!-- Padding examples -->
<div class="p-4">Base padding (16px)</div>
<div class="px-6 py-3">Horizontal 24px, Vertical 12px</div>

<!-- Margin examples -->
<div class="mt-8 mb-12">Top 32px, Bottom 48px</div>

<!-- Gap examples (for flex/grid) -->
<div class="flex gap-4">Items with 16px gap</div>
<div class="grid gap-6">Grid with 24px gap</div>
```

### Spacing Scale
- `0` = 0
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px (base unit)
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px
- `12` = 48px
- `16` = 64px
- `20` = 80px
- `24` = 96px
- `32` = 128px
- `40` = 160px
- `48` = 192px
- `56` = 224px
- `64` = 256px

## Shadows & Elevation

### Elevation System
Use elevation levels to communicate hierarchy:

```html
<div class="shadow-elevation-0">Flat (no shadow)</div>
<div class="shadow-elevation-1">Raised - subtle elevation for cards</div>
<div class="shadow-elevation-2">Overlay - for dropdowns and popovers</div>
<div class="shadow-elevation-3">Modal - for modal dialogs</div>
<div class="shadow-elevation-4">Popover - highest elevation</div>
```

### Size-based Shadows
```html
<div class="shadow-xs">Extra small</div>
<div class="shadow-sm">Small</div>
<div class="shadow-md">Medium</div>
<div class="shadow-lg">Large</div>
<div class="shadow-xl">Extra large</div>
<div class="shadow-2xl">2X large</div>
```

### Glow Effects
```html
<button class="shadow-glow-primary">Primary glow</button>
<button class="shadow-glow-accent">Accent glow</button>
```

## Border Radius

```html
<div class="rounded-none">No radius (0)</div>
<div class="rounded-sm">Small (4px)</div>
<div class="rounded-md">Medium (8px) - default for most components</div>
<div class="rounded-lg">Large (12px)</div>
<div class="rounded-xl">Extra large (16px)</div>
<div class="rounded-2xl">2X large (24px)</div>
<div class="rounded-full">Fully rounded (pills/circles)</div>
```

## Animations & Transitions

### Transition Durations
```html
<button class="transition-all duration-instant">Instant (0ms)</button>
<button class="transition-all duration-fast">Fast (150ms)</button>
<button class="transition-all duration-normal">Normal (250ms)</button>
<button class="transition-all duration-slow">Slow (350ms)</button>
<button class="transition-all duration-slower">Slower (500ms)</button>
```

### Easing Functions
```html
<div class="transition ease-linear">Linear</div>
<div class="transition ease-in">Ease in</div>
<div class="transition ease-out">Ease out</div>
<div class="transition ease-in-out">Ease in-out</div>
<div class="transition ease-bounce">Bounce</div>
```

### Common Transition Pattern
```html
<!-- Hover transition example -->
<button class="
  bg-brand 
  hover:bg-brand-hover 
  transition-colors 
  duration-fast 
  ease-out
">
  Hover me
</button>

<!-- Focus transition example -->
<input class="
  border-2 
  border-input-border 
  focus:border-input-focus 
  transition-colors 
  duration-fast 
  ease-out
" />
```

## Usage Examples

### Button with Design System Tokens
```html
<button class="
  px-6 py-3
  text-base font-semibold
  bg-brand hover:bg-brand-hover
  text-white
  rounded-md
  shadow-elevation-1 hover:shadow-elevation-2
  transition-all duration-fast ease-out
">
  Click me
</button>
```

### Card with Design System Tokens
```html
<div class="
  p-6
  bg-card
  rounded-lg
  shadow-elevation-1
  border border-border
">
  <h3 class="text-2xl font-bold mb-4">Card Title</h3>
  <p class="text-base leading-normal text-foreground">
    Card content with proper spacing and typography.
  </p>
</div>
```

### Input with Design System Tokens
```html
<input 
  type="text"
  class="
    px-3 py-2
    text-base
    bg-input-bg
    border border-input-border
    focus:border-input-focus
    rounded-md
    transition-colors duration-fast ease-out
  "
  placeholder="Enter text..."
/>
```

## Migration Notes

- All design system tokens are backward compatible with existing utilities
- Legacy spacing values (18, 88, 128) are still available
- Legacy shadow names (glow, elevated) are still available
- Gradually migrate to new token-based utilities for consistency
- Use `elevation-*` shadows for semantic elevation levels
- Use size-based shadows (xs, sm, md, lg, xl, 2xl) for specific sizes

## Dark Mode Support

All shadows automatically adjust for dark mode when using the `.dark` class:

```html
<!-- Light mode: subtle shadow -->
<!-- Dark mode: stronger shadow for visibility -->
<div class="shadow-elevation-1 dark:shadow-elevation-1">
  Automatically adjusts for dark mode
</div>
```

Note: Shadow values in dark mode use higher opacity to maintain visibility against dark backgrounds.
