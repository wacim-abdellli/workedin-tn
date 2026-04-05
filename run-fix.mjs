const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');

// Just replace everything from ":root {" down to the start of "/* ===== GLOBAL TYPOGRAPHY" OR the global body styles.
let parts = css.split('@tailwind utilities;');

if (parts.length < 2) {
    console.error("Could not find @tailwind utilities;");
    process.exit(1);
}

// Let's find the end of the root/dark block.
let bottomPartIndex = parts[1].indexOf('body {');
if (bottomPartIndex === -1) {
    bottomPartIndex = parts[1].indexOf('.gradient-dark');
}

let bottomPart = parts[1].substring(bottomPartIndex);

const newRoot = `
:root {
    /* Brand Colors - New Violet and Amber */
    --khedma-violet: #5B21B6; /* Violet 800 */
    --khedma-violet-hover: #4C1D95; /* Violet 900 */
    --khedma-amber: #D97706; /* Amber 600 */
    --khedma-amber-hover: #B45309; /* Amber 700 */

    /* Freelancer workspace (violet-themed) - Default */
    --workspace-primary: #5B21B6;
    --workspace-primary-hover: #4C1D95;
    --workspace-primary-light: #F3E8FF; /* Violet 100 */
    --workspace-primary-mid: #A78BFA; /* Violet 400 */
    --workspace-primary-text: #ffffff;

    /* Shared CTA */
    --brand-accent: #D97706;
    --brand-accent-hover: #B45309;

    --text-xs: clamp(0.75rem, 1.5vw, 0.875rem);
    --text-sm: clamp(0.875rem, 1.8vw, 1rem);
    --text-base: clamp(1rem, 2vw, 1.125rem);
    --text-lg: clamp(1.125rem, 2.5vw, 1.25rem);
    --text-xl: clamp(1.25rem, 3vw, 1.5rem);
    --text-2xl: clamp(1.5rem, 4vw, 2rem);
    --text-3xl: clamp(1.875rem, 5vw, 2.5rem);
    --text-4xl: clamp(2.25rem, 6vw, 3.5rem);
    --text-5xl: clamp(3rem, 8vw, 5rem);

    /* Professional Light Mode - Clean Slate/Zinc */
    --page-bg: #F8FAFC; 
    --surface-bg: #FFFFFF;
    --card-bg: #FFFFFF;
    --sidebar-bg: #FFFFFF;
    --input-bg: #FFFFFF;
    --input-border: #E2E8F0;
    --input-border-focus: #5B21B6;
    --text-primary: #0F172A;
    --text-secondary: #475569;
    --text-muted: #64748B;
    --text-placeholder: #94A3B8;
    --border: #E2E8F0;
    --border-strong: #CBD5E1;

    --color-bg: var(--page-bg);
    --color-bg-secondary: var(--card-bg);
    --color-bg-tertiary: var(--surface-bg);
    --color-fg: var(--text-primary);
    --color-fg-secondary: var(--text-secondary);
    --color-fg-muted: var(--text-muted);
    --color-border: var(--border);
    --color-border-subtle: var(--border-strong);

    /* Clean Gradients */
    --gradient-primary: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
    --gradient-accent: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    --gradient-glass: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%);
    --gradient-surface: linear-gradient(145deg, #ffffff, #f1f5f9);
  
    /* Refined Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

    --shadow-glow: 0 0 15px rgba(91, 33, 182, 0.3);
    --shadow-glow-accent: 0 0 15px rgba(217, 119, 6, 0.3);

    --radius-card: 1rem;
    --radius-panel: 1.5rem;
    --radius-shell: 2rem;
    --elevation-1: var(--shadow-md);
    --elevation-2: var(--shadow-lg);
    --elevation-modal: 0 25px 60px rgba(0, 0, 0, 0.45);

    --motion-fast: 140ms;
    --motion-base: 220ms;
    --motion-slow: 320ms;
    --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
    --motion-ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);

    --dash-bg: #F8FAFC;
    --dash-card: #FFFFFF;
    --dash-card-hover: #F1F5F9;
    --dash-raised: #FFFFFF;
    --dash-border: #E2E8F0;
    --dash-border-hover: #CBD5E1;

    --widget-accent-border: 3px solid var(--workspace-primary);
    --stat-pill-bg: rgba(91, 33, 182, 0.04);
    --stat-pill-border: rgba(91, 33, 182, 0.08);
}

.workspace-client {
  --workspace-primary: #D97706; /* Amber 600 */
  --workspace-primary-hover: #B45309;
  --workspace-primary-light: #FEF3C7;
  --workspace-primary-mid: #FDE68A;
  --workspace-primary-text: #ffffff;
  --brand-accent: #5B21B6;
  --brand-accent-hover: #4C1D95;
}

.dark .workspace-client {
  --workspace-primary: #D97706;
  --workspace-primary-hover: #B45309;
  --workspace-primary-light: #451A03;
  --workspace-primary-mid: #78350F;
  --workspace-primary-text: #ffffff;
}

.workspace-admin {
  --workspace-primary: #0F172A;
  --workspace-primary-hover: #020617;
  --workspace-primary-light: #E2E8F0;
  --workspace-primary-mid: #94A3B8;
  --workspace-primary-text: #ffffff;
  --brand-accent: #5B21B6;
  --brand-accent-hover: #4C1D95;
}

.dark .workspace-admin {
  --workspace-primary: #F8FAFC;
  --workspace-primary-hover: #FFFFFF;
  --workspace-primary-light: #334155;
  --workspace-primary-mid: #475569;
  --workspace-primary-text: #020617;
}

.dark {
  --dash-bg: #030712; 
  --dash-card: #09090B; 
  --dash-card-hover: #18181B; 
  --dash-raised: #18181B; 
  --dash-border: #27272A;
  --dash-border-hover: #3F3F46;

  --workspace-primary: #7C3AED;
  --workspace-primary-hover: #8B5CF6;
  --workspace-primary-light: #2E1065;
  --workspace-primary-mid: #4C1D95;
  --workspace-primary-text: #ffffff;

  --brand-accent: #D97706;
  --brand-accent-hover: #F59E0B;

  /* Dark Mode - Professional Graphite/Zinc */
  --page-bg: #030712;
  --surface-bg: #09090B;
  --card-bg: #09090B; 
  --sidebar-bg: #030712; 
  --input-bg: #18181B;
  --input-border: #27272A;
  --input-border-focus: #7C3AED;
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-muted: #71717A;
  --text-placeholder: #52525B;
  --border: #27272A;
  --border-strong: #3F3F46;

  --color-bg: var(--page-bg);
  --color-bg-secondary: var(--card-bg);
  --color-bg-tertiary: var(--surface-bg);
  --color-fg: var(--text-primary);
  --color-fg-secondary: var(--text-secondary);
  --color-fg-muted: var(--text-muted);
  --color-border: var(--border);
  --color-border-subtle: var(--border-strong);

  --gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
  --gradient-accent: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --gradient-glass: linear-gradient(180deg, rgba(24, 24, 27, 0.8) 0%, rgba(9, 9, 11, 0.5) 100%);
  --gradient-surface: linear-gradient(145deg, #18181B, #09090B);

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  
  --stat-pill-bg: rgba(255,255,255,0.03);
  --stat-pill-border: rgba(255,255,255,0.05);
}

`;

fs.writeFileSync('src/index.css', parts[0] + '@tailwind utilities;\n\n' + newRoot + '\n\n' + bottomPart);
console.log('Success index.css');
