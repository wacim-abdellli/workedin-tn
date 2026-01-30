# Types Directory

This directory contains TypeScript type definitions and interfaces used throughout the application.

## Structure

- **`index.ts`**: Main entry point exporting shared types.
- **`freelancer.ts`**: Types specific to freelancer profiles and data.
- **`contracts.ts`**: Types related to job contracts.

## Key Interfaces

- **`User`**: Supabase Auth user definition.
- **`Profile`**: Public profile information.
- **`Job`**: Job posting structure.

## Guidelines

- Define all shared data structures here.
- Avoid `any` types; strictly type all data interfaces.
