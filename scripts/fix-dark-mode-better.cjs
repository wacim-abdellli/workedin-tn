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
  if (!fp.endsWith('.tsx') && !fp.endsWith('.ts') && !fp.endsWith('.jsx')) return false;
  let content = fs.readFileSync(fp, 'utf8');
  let originalContent = content;

  const replacements = {
    'bg-white': 'dark:bg-gray-800',
    'bg-gray-50': 'dark:bg-gray-900',
    'border-gray-200': 'dark:border-gray-700',
    'text-gray-900': 'dark:text-white',
    'text-gray-600': 'dark:text-gray-300'
  };

  const types = {
    'bg-white': 'bg',
    'bg-gray-50': 'bg',
    'border-gray-200': 'border',
    'text-gray-900': 'text',
    'text-gray-600': 'text'
  };

  content = content.replace(/(['"`])([^'"`]*)(['"`])/g, (match, openQuote, innerString, closeQuote) => {
    // Check if it's likely a classlist string (has one of our tokens)
    const hasToken = Object.keys(replacements).some(k => innerString.includes(k));
    if (!hasToken) return match;

    let parts = innerString.split(/([ \n\t]+)/);
    let changed = false;

    for (let i = 0; i < parts.length; i++) {
        let cls = parts[i];
        if (replacements[cls]) {
             const type = types[cls];
             // Simple hack: if there isn't a dark:bg- or dark:text- etc in this whole string component
             // Wait, it's better to just check if `dark:${type}` exists in the original `innerString`!
             if (!innerString.includes(`dark:${type}-`) && !innerString.includes(`dark:${type} `) && !innerString.endsWith(`dark:${type}`)) {
                 parts[i] += ` ${replacements[cls]}`;
                 changed = true;
                 // Re-evaluate innerString so subsequent checks don't skip
                 innerString += ` ${replacements[cls]}`;
             }
        }
    }

    if (changed) return openQuote + parts.join('') + closeQuote;
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fp, content, 'utf8');
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
