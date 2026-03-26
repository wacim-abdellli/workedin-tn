# Components Directory

This directory contains all the React components for the application, organized by their functionality and usage scope.

## Structure

- **`common/`**: Reusable components used across multiple pages or features (e.g., `SEO`, `SkeletonCard`).
- **`layout/`**: Structural components like `Header`, `Footer`, `MobileNav`, and `SkipLinks`.
- **`ui/`**: Core design system components (Atomic design) such as `Button`, `Input`, `Modal`, `Toast`.
- **`routing/`**: Components specifically for handling routing logic (e.g., `ProfileRedirect`).
- **`freelancer/`**: Feature-specific components for Freelancer functionalities.
- **`jobs/`**: Feature-specific components for Job Board and Job Management.

## Usage Guidelines

- Prefer using components from `ui/` for basic elements to ensure design consistency.
- New pages and major UI changes must use shared page/list/form/status primitives from `src/index.css` and reusable components from `ui/` before introducing custom one-off styles.
- If a new pattern is needed, add it as a reusable primitive first, then consume it in feature pages.
- Feature-specific components should be kept within their respective folders.
- Avoid importing directly from deep paths; use `index.ts` files where available (though currently largely direct imports).
