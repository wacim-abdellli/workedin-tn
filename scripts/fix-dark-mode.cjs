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

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx')) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const replacements = [
    { base: 'bg-white', dark: 'dark:bg-gray-800', type: 'bg' },
    { base: 'bg-gray-50', dark: 'dark:bg-gray-900', type: 'bg' },
    { base: 'bg-gray-100', dark: 'dark:bg-gray-800', type: 'bg' },
    { base: 'border-gray-200', dark: 'dark:border-gray-700', type: 'border' },
    { base: 'border-gray-300', dark: 'dark:border-gray-600', type: 'border' },
    { base: 'text-gray-900', dark: 'dark:text-white', type: 'text' },
    { base: 'text-gray-800', dark: 'dark:text-gray-100', type: 'text' },
    { base: 'text-gray-700', dark: 'dark:text-gray-200', type: 'text' },
    { base: 'text-gray-600', dark: 'dark:text-gray-300', type: 'text' },
    { base: 'text-gray-500', dark: 'dark:text-gray-400', type: 'text' },
  ];

  const classStringRegex = /className=(?:["']([^"']+)["']|\{`([^`]+)`\}|\{'([^']+)'\}|\{"([^"]+)"\})/g;
  
  content = content.replace(classStringRegex, (match, p1, p2, p3, p4) => {
    let classNames = p1 || p2 || p3 || p4 || "";
    if(!classNames) return match;
    
    let classes = classNames.split(/\s+/);
    let changed = false;

    replacements.forEach(({base, dark, type}) => {
      if (classes.includes(base)) {
        const hasDark = classes.some(c => c.startsWith(`dark:${type}`));
        if (!hasDark && !classes.includes(dark)) {
          classes.push(dark);
          changed = true;
        }
      }
    });

    if (changed) {
      return match.replace(classNames, classes.join(' '));
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
  }
  return false;
}

let totalUpdated = 0;
targets.forEach(target => {
  const fullPath = path.join(process.cwd(), target);
  if (fs.existsSync(fullPath)) {
     if (fs.statSync(fullPath).isDirectory()) {
         const walk = (dir) => {
             const files = fs.readdirSync(dir);
             files.forEach(f => {
                const fp = path.join(dir, f);
                if (fs.statSync(fp).isDirectory()) {
                    walk(fp);
                } else {
                    if(processFile(fp)) totalUpdated++;
                }
             });
         };
         walk(fullPath);
     } else {
         if(processFile(fullPath)) totalUpdated++;
     }
  } else {
    console.log(`Target not found: ${target}`);
  }
});

console.log(`\nTotal files updated: ${totalUpdated}`);
