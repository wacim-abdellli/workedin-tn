const fs = require('fs');
const path = require('path');

const targets = [
  'src/pages/AdminDashboard.tsx',
  'src/pages/ClientDashboard.tsx',
  'src/pages/FreelancerDashboard.tsx',
  'src/pages/PortfolioDashboard.tsx',
  'src/pages/admin',
  'src/components/admin',
  'src/components/dashboard'
];

function processFile(fp) {
  if (!fp.endsWith('.tsx') && !fp.endsWith('.ts')) return false;
  let content = fs.readFileSync(fp, 'utf8');
  let originalContent = content;

  const regexes = [
    { regex: /(className=(?:\"|[^{]*?\{[`'\"])[^\"]*?)(\s?bg-white)(?!\/)(?![^\"'`]*?dark:bg-)/g, replacement: '$1$2 dark:bg-gray-800' },
    { regex: /(className=(?:\"|[^{]*?\{[`'\"])[^\"]*?)(\s?bg-gray-50)(?!\/)(?![^\"'`]*?dark:bg-)/g, replacement: '$1$2 dark:bg-gray-900' },
    { regex: /(className=(?:\"|[^{]*?\{[`'\"])[^\"]*?)(\s?border-gray-200)(?!\/)(?![^\"'`]*?dark:border-)/g, replacement: '$1$2 dark:border-gray-700' },
    { regex: /(className=(?:\"|[^{]*?\{[`'\"])[^\"]*?)(\s?text-gray-900)(?!\/)(?![^\"'`]*?dark:text-)/g, replacement: '$1$2 dark:text-white' },
    { regex: /(className=(?:\"|[^{]*?\{[`'\"])[^\"]*?)(\s?text-gray-600)(?!\/)(?![^\"'`]*?dark:text-)/g, replacement: '$1$2 dark:text-gray-300' }
  ];

  regexes.forEach(({ regex, replacement }) => {
    // apply multiple times because my regex only matches the FIRST one if there's multiple in the same string since the lookahead consumes/checks
    // Actually wait, let's just do a simpler strategy without matching `className=` everywhere.
  });

  // Alternative strategy: replace token by token if it doesn't have a dark equivalent nearby
  // Split content by `<` to process element by element
  const newContent = content.split('<').map((tagContent, index) => {
    if (index === 0) return tagContent;
    // extract className attribute if any
    return tagContent.replace(/className=(?:\"([^"]*)\"|\{`([^`]+)`\}|\{'([^']+)'\}|\{([^}]+)\})/g, (match, p1, p2, p3, p4) => {
      let str = p1 || p2 || p3;
      if (!str) return match; // fallback for complex JS expressions inside className={}
      
      let classes = str.split(/\s+/);
      let changed = false;

      const rules = [
        { find: 'bg-white', replace: 'dark:bg-gray-800', type: 'bg' },
        { find: 'bg-gray-50', replace: 'dark:bg-gray-900', type: 'bg' },
        { find: 'border-gray-200', replace: 'dark:border-gray-700', type: 'border' },
        { find: 'text-gray-900', replace: 'dark:text-white', type: 'text' },
        { find: 'text-gray-600', replace: 'dark:text-gray-300', type: 'text' }
      ];

      rules.forEach(rule => {
        if (classes.includes(rule.find)) {
          // ensure no dark variant exists
          const hasDark = classes.some(c => c.startsWith(`dark:${rule.type}`));
          if (!hasDark && !classes.includes(rule.replace)) {
            classes.push(rule.replace);
            changed = true;
          }
        }
      });

      if (changed) {
        if (p1) return `className="${classes.join(' ')}"`;
        if (p2) return `className={\`${classes.join(' ')}\`}`;
        if (p3) return `className={'${classes.join(' ')}'}`;
      }
      return match;
    });
  }).join('<');

  if (newContent !== originalContent) {
    fs.writeFileSync(fp, newContent, 'utf8');
    console.log(`Updated: ${fp}`);
    return true;
  }
  return false;
}

let count = 0;
targets.forEach(t => {
  const fullPath = path.join(process.cwd(), t);
  if (!fs.existsSync(fullPath)) return;
  
  if (fs.statSync(fullPath).isDirectory()) {
      const walk = (d) => {
          fs.readdirSync(d).forEach(f => {
              const cp = path.join(d, f);
              if (fs.statSync(cp).isDirectory()) walk(cp);
              else {
                  if (processFile(cp)) count++;
              }
          });
      };
      walk(fullPath);
  } else {
      if (processFile(fullPath)) count++;
  }
});

console.log('Total files updated:', count);
