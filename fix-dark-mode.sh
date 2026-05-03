#!/bin/bash

# Dark/Light Mode Fix Script
# This script systematically replaces hardcoded colors with CSS variables

echo "Starting dark/light mode fixes..."

# Common replacements across all files
find src/pages -type f -name "*.tsx" -exec sed -i '
# Backgrounds
s/bg-white\([^-/]\)/bg-[var(--color-bg-base)]\1/g
s/bg-black\([^-/]\)/bg-[var(--color-bg-base)]\1/g
s/bg-white\/\[0\.02\]/bg-[var(--color-bg-subtle)]/g
s/bg-white\/5/bg-[var(--color-bg-subtle)]/g
s/bg-white\/10/bg-[var(--color-bg-muted)]/g
s/#0a0a0a/var(--color-bg-base)/g
s/#ffffff/var(--color-bg-base)/g

# Text colors
s/text-white\([^-/]\)/text-[var(--color-text-primary)]\1/g
s/text-white\/90/text-[var(--color-text-primary)]/g
s/text-white\/80/text-[var(--color-text-secondary)]/g
s/text-white\/50/text-[var(--color-text-secondary)]/g
s/text-white\/40/text-[var(--color-text-tertiary)]/g
s/text-white\/30/text-[var(--color-text-tertiary)]/g

# Borders
s/border-white\/5/border-[var(--color-border-subtle)]/g
s/border-white\/10/border-[var(--color-border-default)]/g
s/border-white\/20/border-[var(--color-border-strong)]/g

# Workspace colors
s/text-violet-300/text-[var(--workspace-primary-mid)]/g
s/text-violet-400/text-[var(--workspace-primary)]/g
s/text-violet-500/text-[var(--workspace-primary)]/g
s/bg-violet-500\/10/bg-[var(--workspace-primary-dim)]/g
s/text-orange-300/text-[var(--workspace-primary-mid)]/g
s/text-orange-400/text-[var(--workspace-primary)]/g

# Status colors
s/text-emerald-300/text-[var(--color-status-success)]/g
s/bg-emerald-500\/10/bg-[var(--color-status-success-bg)]/g
s/text-red-500/text-[var(--color-status-error)]/g
s/bg-red-500\/10/bg-[var(--color-status-error-bg)]/g
' {} \;

echo "Dark/light mode fixes completed!"
