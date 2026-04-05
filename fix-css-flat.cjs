const fs = require('fs');

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace Button Styles
css = css.replace(/\/\* ===== BUTTONS ===== \*\/.+?\/\* ===== CARDS ===== \*\//s, `/* ===== BUTTONS ===== */
  .btn {
    @apply inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
  }

  .btn-primary {
    @apply text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border border-transparent shadow-sm;
  }

  .btn-accent {
    @apply text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 border border-transparent;
  }

  .btn-secondary {
    @apply text-zinc-700 bg-white border border-gray-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-sm hover:text-zinc-900 dark:hover:text-zinc-100;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 border border-transparent;
  }

  .btn-outline {
    @apply border border-zinc-200 bg-transparent hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm;
  }

  .btn-ghost {
    @apply text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100;
  }

  .btn-sm {
    @apply px-3 py-1.5 text-sm rounded-md;
  }

  .btn-md {
    @apply px-4 py-2 text-base rounded-lg;
  }

  .btn-lg {
    @apply px-6 py-3 text-lg rounded-xl;
  }

  /* ===== CARDS ===== */`);

// Replace Card Styles
css = css.replace(/\/\* ===== CARDS ===== \*\/.*?\/\* Card Hover Shine Effect \*\//s, `/* ===== CARDS ===== */
  .card {
    @apply bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm transition-all;
  }

  .card-hover {
    @apply card cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md;
  }

  .card-glass {
    @apply bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 shadow-sm rounded-xl p-5;
  }

  .glass-card {
    @apply bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border border-gray-200/80 dark:border-zinc-800/80 shadow-sm rounded-xl p-5;
  }

  /* Card Hover Shine Effect */`);

fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully');
