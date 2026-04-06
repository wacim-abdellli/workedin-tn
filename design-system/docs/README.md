# Khedma TN Design System Documentation

This is the documentation site for the Khedma TN Design System, built with Vite + React + TypeScript.

## Getting Started

### Installation

```bash
cd design-system/docs
npm install
```

### Development

```bash
npm run dev
```

The documentation site will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

The built site will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Structure

```
docs/
├── src/
│   ├── components/       # Reusable documentation components
│   │   ├── DocLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── CodeBlock.tsx
│   ├── pages/
│   │   ├── GettingStarted.tsx
│   │   ├── foundations/  # Foundation pages (colors, typography, etc.)
│   │   ├── components/   # Component documentation pages
│   │   ├── patterns/     # Pattern documentation pages
│   │   └── resources/    # Resource pages (migration, changelog)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Features

- **Interactive Examples**: Live component previews with code snippets
- **Dark Mode**: Full support for light and dark themes
- **Responsive**: Mobile-friendly documentation
- **Search**: Easy navigation through the design system
- **Copy Code**: One-click code copying for all examples

## Navigation Structure

1. **Getting Started** - Introduction and setup
2. **Foundations** - Colors, Typography, Spacing, Shadows, Animations
3. **Components** - Button, Input, Badge, Modal, Toast, Loading States
4. **Patterns** - Layout patterns and best practices
5. **Resources** - Migration guides, changelog, downloads

## Design Tokens

The documentation site uses the same design tokens as the main application, imported from `../../output/tokens.css`. This ensures the documentation itself demonstrates the design system.

## Contributing

When adding new documentation:

1. Create a new page component in the appropriate directory
2. Add the route to `App.tsx`
3. Add the navigation item to `Navigation.tsx`
4. Follow the existing page structure for consistency

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling with design system tokens
- **Lucide React** - Icon library
