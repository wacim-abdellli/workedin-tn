const fs = require('fs');

let c = fs.readFileSync('src/components/layout/Header/index.tsx', 'utf8');
c = c.replace(
  /className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"\s+style=\{\{ background: 'rgba\(10, 9, 18, 0.85\)', borderColor: 'var\(--dash-border\)' \}\}/,
  'className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b bg-white/85 dark:bg-[#0a0912]/85 border-gray-200 dark:border-[var(--dash-border)]"'
);
fs.writeFileSync('src/components/layout/Header/index.tsx', c);

// Also let's fix the dropdown!
// Wait! We patched the popup background correctly in a previous attempt. 
// "bg-white dark:bg-gray-800" is what it had. 
// Let's ensure the dropdown is completely covered.
