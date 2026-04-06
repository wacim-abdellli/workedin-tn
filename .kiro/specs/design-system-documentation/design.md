# Design Document: Design System Documentation

## Overview

This design document specifies the technical architecture for a comprehensive design system documentation site for the Khedma TN freelance marketplace. The system will transform 46 inconsistent pages into a cohesive, premium UI/UX experience by providing:

- A unified color system with semantic tokens supporting light/dark modes
- Standardized typography, spacing, and layout patterns
- Comprehensive component documentation with interactive examples
- Clear migration paths from current inconsistent implementations
- Automated tooling for token management and code migration

The design system will be built on top of the existing Tailwind CSS + React + TypeScript stack, leveraging CSS custom properties for theming and providing a static documentation site for reference.

### Current State Analysis

Based on the audit findings, the application currently suffers from:

1. **Color Inconsistencies**: Mix of hardcoded Tailwind classes (text-gray-900, bg-primary-600) and CSS variables with inconsistent naming (--workspace-primary, --color-text-primary, --text-primary)
2. **Layout Fragmentation**: No clear guidelines for Grid vs Flexbox usage across 46 pages
3. **Component Duplication**: Similar components with different implementations
4. **No Typography System**: Inconsistent font sizes and weights
5. **Spacing Chaos**: No standardized spacing scale

The existing `src/styles/colors.css` file provides a foundation with primitive tokens (purple, amber, neutral scales) and some semantic tokens, but lacks comprehensive documentation and migration tooling.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Design System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Design Tokens   │────────▶│  Token Compiler  │          │
│  │  (Source Files)  │         │  (Build Tool)    │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           │                            ▼                     │
│           │                   ┌──────────────────┐          │
│           │                   │  Output Formats  │          │
│           │                   │  CSS/SCSS/JS/JSON│          │
│           │                   └──────────────────┘          │
│           │                            │                     │
│           ▼                            │                     │
│  ┌──────────────────┐                 │                     │
│  │  Documentation   │◀────────────────┘                     │
│  │  Site Generator  │                                       │
│  └──────────────────┘                                       │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Static Docs     │         │  Migration Tools │          │
│  │  (Vite/React)    │         │  (CLI Scripts)   │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
project-root/
├── design-system/
│   ├── tokens/
│   │   ├── colors.json              # Source of truth for colors
│   │   ├── typography.json          # Font scales, weights, families
│   │   ├── spacing.json             # Spacing scale
│   │   ├── shadows.json             # Elevation system
│   │   ├── radii.json               # Border radius values
│   │   └── animations.json          # Timing and easing functions
│   ├── build/
│   │   ├── token-compiler.ts        # Converts JSON to CSS/SCSS/JS
│   │   └── generate-docs.ts         # Generates documentation data
│   ├── docs/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── foundations/
│   │   │   │   │   ├── colors.tsx
│   │   │   │   │   ├── typography.tsx
│   │   │   │   │   ├── spacing.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   └── [component].tsx
│   │   │   │   ├── patterns/
│   │   │   │   │   ├── forms.tsx
│   │   │   │   │   └── data-display.tsx
│   │   │   │   └── migration/
│   │   │   │       ├── overview.tsx
│   │   │   │       └── guides.tsx
│   │   │   ├── components/
│   │   │   │   ├── ColorSwatch.tsx
│   │   │   │   ├── CodePlayground.tsx
│   │   │   │   ├── TokenTable.tsx
│   │   │   │   └── ComponentDemo.tsx
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── vite.config.ts
│   ├── scripts/
│   │   ├── migrate-colors.ts        # Automated color migration
│   │   ├── audit-tokens.ts          # Validate token usage
│   │   └── generate-types.ts        # TypeScript definitions
│   └── output/
│       ├── colors.css               # Generated CSS variables
│       ├── tokens.scss              # SCSS variables
│       ├── tokens.js                # JS/TS exports
│       └── tokens.json              # JSON for tooling
├── src/
│   └── styles/
│       ├── design-tokens.css        # Imported generated tokens
│       └── [existing files]
└── package.json
```

## Components and Interfaces

### Token Compiler

The token compiler transforms JSON token definitions into multiple output formats.

**Input Format (colors.json example):**

```json
{
  "primitive": {
    "purple": {
      "50": "#faf5ff",
      "100": "#f3e8ff",
      "600": "#9333ea",
      "900": "#581c87"
    }
  },
  "semantic": {
    "brand": {
      "primary": {
        "value": "{primitive.purple.600}",
        "description": "Primary brand color for buttons and links"
      }
    },
    "text": {
      "primary": {
        "light": "{primitive.neutral.900}",
        "dark": "{primitive.neutral.50}",
        "description": "Primary text color"
      }
    }
  }
}
```

**Output Format (CSS):**

```css
:root {
  /* Primitive tokens */
  --purple-50: #faf5ff;
  --purple-600: #9333ea;
  
  /* Semantic tokens - Light mode */
  --color-brand-primary: var(--purple-600);
  --color-text-primary: var(--neutral-900);
}

.dark {
  /* Semantic tokens - Dark mode */
  --color-text-primary: var(--neutral-50);
}
```

**TypeScript Interface:**

```typescript
interface TokenDefinition {
  value: string;
  description?: string;
  deprecated?: boolean;
  replacement?: string;
}

interface ColorToken extends TokenDefinition {
  contrast?: {
    light: number;  // WCAG contrast ratio
    dark: number;
  };
}

interface TokenCompiler {
  compile(source: string, format: 'css' | 'scss' | 'js' | 'json'): string;
  validate(tokens: Record<string, any>): ValidationResult;
  generateTypes(): string;
}
```

### Documentation Site Components

**ColorSwatch Component:**

```typescript
interface ColorSwatchProps {
  name: string;
  value: string;
  description?: string;
  contrastRatio?: number;
  usage: string[];
}

// Displays color with hex value, contrast ratio, and usage examples
```

**CodePlayground Component:**

```typescript
interface CodePlaygroundProps {
  component: React.ComponentType;
  code: string;
  editable?: boolean;
  presets?: Record<string, any>;
}

// Live component preview with editable props
```

**TokenTable Component:**

```typescript
interface TokenTableProps {
  tokens: Array<{
    name: string;
    value: string;
    description: string;
    category: string;
  }>;
  searchable?: boolean;
  filterable?: boolean;
}

// Searchable, filterable table of all tokens
```

### Migration Tools

**Color Migration Script:**

```typescript
interface MigrationRule {
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  description: string;
}

interface ColorMigrator {
  // Scans files for hardcoded colors
  scan(directory: string): MigrationReport;
  
  // Applies automated replacements
  migrate(files: string[], dryRun?: boolean): MigrationResult;
  
  // Generates migration report
  report(): string;
}

// Example rules:
// text-gray-900 → text-[var(--color-text-primary)]
// bg-primary-600 → bg-brand
```

## Data Models

### Token Schema

```typescript
// Core token types
type TokenValue = string | number;
type TokenReference = `{${string}}`;  // e.g., "{primitive.purple.600}"

interface BaseToken {
  $type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'cubicBezier';
  $value: TokenValue | TokenReference;
  $description?: string;
}

interface ColorTokenGroup {
  [key: string]: BaseToken | ColorTokenGroup;
}

// Design token file structure
interface DesignTokens {
  primitive: {
    colors: ColorTokenGroup;
    spacing: Record<string, BaseToken>;
    typography: {
      fontFamilies: Record<string, BaseToken>;
      fontSizes: Record<string, BaseToken>;
      fontWeights: Record<string, BaseToken>;
      lineHeights: Record<string, BaseToken>;
    };
  };
  semantic: {
    colors: {
      brand: ColorTokenGroup;
      text: ColorTokenGroup;
      background: ColorTokenGroup;
      border: ColorTokenGroup;
      status: ColorTokenGroup;
    };
    spacing: Record<string, BaseToken>;
  };
  component: {
    button: Record<string, BaseToken>;
    input: Record<string, BaseToken>;
    // ... other components
  };
}
```

### Component Documentation Schema

```typescript
interface ComponentDoc {
  name: string;
  description: string;
  category: 'form' | 'navigation' | 'feedback' | 'data-display' | 'layout';
  props: PropDefinition[];
  variants: VariantDefinition[];
  examples: ExampleDefinition[];
  accessibility: AccessibilityGuidelines;
  relatedComponents: string[];
}

interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
}

interface VariantDefinition {
  name: string;
  description: string;
  props: Record<string, any>;
  preview: string;  // Code snippet
}

interface ExampleDefinition {
  title: string;
  description: string;
  code: string;
  preview: React.ComponentType;
}

interface AccessibilityGuidelines {
  keyboardNavigation: string[];
  ariaAttributes: string[];
  contrastRequirements: string;
  screenReaderNotes: string[];
}
```

### Migration Report Schema

```typescript
interface MigrationReport {
  totalFiles: number;
  filesWithIssues: number;
  issues: MigrationIssue[];
  summary: {
    hardcodedColors: number;
    inconsistentNaming: number;
    missingTokens: number;
  };
}

interface MigrationIssue {
  file: string;
  line: number;
  column: number;
  type: 'hardcoded-color' | 'inconsistent-naming' | 'deprecated-token';
  current: string;
  suggested: string;
  autoFixable: boolean;
}
```

