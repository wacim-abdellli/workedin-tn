#!/bin/bash

# Bulk color replacement script for Khedma TN
# This script replaces all hardcoded dark mode colors with CSS variables

echo "Starting bulk color replacement..."

# Replace dark background colors with CSS variables
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#1a1825\]/dark:bg-[var(--color-bg-muted)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#171421\]/dark:bg-[var(--color-bg-muted)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0f0e17\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0b0912\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0b0a12\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#141320\]/dark:bg-[var(--color-bg-subtle)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#1c1a2e\]/dark:bg-[var(--color-bg-muted)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0a0910\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#111020\]/dark:bg-[var(--color-bg-subtle)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#1d2231\]/dark:bg-[var(--color-bg-elevated)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#120f1c\]/dark:bg-[var(--color-bg-subtle)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0f0d16\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0d0b14\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#17142a\]/dark:bg-[var(--color-bg-muted)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#211b3a\]/dark:bg-[var(--color-bg-elevated)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#18223a\]/dark:bg-[var(--color-bg-elevated)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#1a2435\]/dark:bg-[var(--color-bg-elevated)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#0f0d1a\]/dark:bg-[var(--color-bg-base)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:bg-\[#171422\]/dark:bg-[var(--color-bg-muted)]/g' {} +

# Replace border colors
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/dark:border-\[#302b4a\]/dark:border-[var(--color-border-default)]/g' {} +

# Replace specific background patterns
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-\[#f6f3ff\]/bg-[var(--color-bg-subtle)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-\[#faf8ff\]/bg-[var(--color-bg-subtle)]/g' {} +
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-\[#fcfbff\]/bg-[var(--color-bg-elevated)]/g' {} +

echo "Bulk replacement complete!"
echo "Files modified. Please review changes before committing."
