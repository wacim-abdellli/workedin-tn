# Design System Token Infrastructure

This directory contains the design token infrastructure for the Khedma TN application. Design tokens are the single source of truth for colors, typography, spacing, shadows, border radii, and animations.

## Directory Structure

```
design-system/
├── tokens/              # Source token files (JSON)
│   ├── colors.json      # Color palette and semantic colors
│   ├── typography.json  # Font families, sizes, weights, line heights
│   ├── spacing.json     # Spacing scale and semantic spacing
│   ├── shadows.json     # Shadow and elevation system
│   ├── radii.json       # Border radius values
│   └── animations.json  # Animation durations and easing functions
├── build/               # Build tools
│   └── token-compiler.js # Compiles JSON tokens to CSS/SCSS/JS/JSON
├── output/              # Generated files (auto-generated, do not edit)
│   ├── tokens.css       # CSS custom properties
│   ├── tokens.scss      # SCSS variables
│   ├── tokens.js        # JavaScript/TypeScript exports
│   └── tokens.json      # JSON format for tooling
└── README.md           # This file
```

## Usage

### Compiling Tokens

After making changes to any token source files in `tokens/`, run:

```bash
npm run tokens:compile
```

This will regenerate all output files in the `output/` directory.

### Using Tokens in Your Application

The generated tokens are automatically imported into the application via `src/styles/design-tokens.css`.

#### In CSS/SCSS

```css
.my-component {
  /* Colors */
  color: var(--color-text-primary);
  background: var(--color-background-base);
  border-color: var(--color-border-default);
  
  /* Typography */
  font-family: var(--font-fontFamily-body);
  font-size: var(--font-fontSize-base);
  font-weight: var(--font-fontWeight-medium);
  line-height: var(--font-lineHeight-normal);
  
  /* Spacing */
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  
  /* Border Radius */
  border-radius: var(--radius-md);
  
  /* Shadows */
  box-shadow: var(--shadow-elevation-1);
  
  /* Animations */
  transition-duration: var(--animation-duration-normal);
  transition-timing-function: var(--animation-easing-ease-out);
}
```

#### In JavaScript/TypeScript

```typescript
import tokens from '../design-system/output/tokens.js';

// Access token values
const primaryColor = tokens.colors.semantic.brand.primary.value;
const baseFontSize = tokens.typography.fontSizes.base.value;
```

## Token Categories

### Colors

- **Primitive Colors**: Base color scales (purple, amber, neutral, green, red, blue, indigo)
- **Semantic Colors**: Purpose-based colors (brand, text, background, border, status)
- **Light/Dark Mode**: Automatic theme switching support

### Typography

- **Font Families**: heading, body, mono
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl
- **Font Weights**: light, normal, medium, semibold, bold, extrabold
- **Line Heights**: tight, snug, normal, relaxed, loose
- **Letter Spacing**: tighter, tight, normal, wide, wider, widest

### Spacing

- **Scale**: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
- **Semantic**: button-padding, card-padding, section-gap, input-padding

### Shadows

- **Elevation Levels**: 0 (flat), 1 (raised), 2 (overlay), 3 (modal), 4 (popover)
- **Sizes**: xs, sm, md, lg, xl, 2xl
- **Glow Effects**: primary, accent

### Border Radii

- **Scale**: none, sm, md, lg, xl, 2xl, full
- **Semantic**: button, input, card, modal, badge

### Animations

- **Duration**: instant, fast, normal, slow, slower
- **Easing**: linear, ease-in, ease-out, ease-in-out, bounce
- **Semantic**: hover, focus, modal, toast, page

## Token References

Tokens can reference other tokens using the `{category.name}` syntax:

```json
{
  "semantic": {
    "brand": {
      "primary": {
        "value": "{primitive.purple.600}",
        "description": "Primary brand color"
      }
    }
  }
}
```

The token compiler automatically resolves these references.

## Light/Dark Mode

Tokens that differ between light and dark modes use the `light` and `dark` keys:

```json
{
  "text": {
    "primary": {
      "light": "{primitive.neutral.900}",
      "dark": "{primitive.neutral.50}",
      "description": "Primary text color"
    }
  }
}
```

The compiler generates appropriate CSS for both modes:

```css
:root {
  --color-text-primary: #171717;
}

.dark {
  --color-text-primary: #fafafa;
}
```

## Best Practices

1. **Always use semantic tokens** in your components, not primitive tokens
2. **Run `npm run tokens:compile`** after making changes to token files
3. **Never edit generated files** in the `output/` directory directly
4. **Document your tokens** with clear descriptions
5. **Use token references** to maintain consistency and make updates easier

## Migration from Legacy Colors

The design system tokens are designed to work alongside the existing color system in `src/styles/colors.css`. Over time, components should migrate to use the new token system for better consistency and maintainability.

## Future Enhancements

- [ ] Add token validation and linting
- [ ] Generate TypeScript type definitions
- [ ] Create visual documentation site
- [ ] Add migration tools for automated refactoring
- [ ] Support for additional token types (breakpoints, z-index, etc.)
