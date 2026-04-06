const fs = require('fs');
const path = require('path');

const targetPaths = [
  'src/pages/Settings.tsx',
  'src/pages/FreelancerEarnings.tsx',
  'src/pages/Wallet.tsx',
  'src/pages/PaymentSuccess.tsx',
  'src/pages/PaymentFailed.tsx',
  'src/components/settings',
  'src/components/payments'
];

function processPath(p) {
  const fullPath = path.resolve(p);
  if (!fs.existsSync(fullPath)) return;
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.readdirSync(fullPath).forEach(file => {
      processPath(path.join(p, file));
    });
  } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    content = content.replace(/(?<!dark:)bg-white(?!\sdark:bg-)/g, 'bg-white dark:bg-slate-900');
    content = content.replace(/(?<!dark:)bg-gray-50(?!\sdark:bg-)/g, 'bg-gray-50 dark:bg-gray-800');
    content = content.replace(/(?<!dark:)bg-gray-100(?!\sdark:bg-)/g, 'bg-gray-100 dark:bg-gray-800');
    
    content = content.replace(/(?<!dark:)(?<!-)text-gray-900(?!\sdark:text-)/g, 'text-gray-900 dark:text-gray-100');
    content = content.replace(/(?<!dark:)(?<!-)text-gray-800(?!\sdark:text-)/g, 'text-gray-800 dark:text-gray-100');
    content = content.replace(/(?<!dark:)(?<!-)text-gray-700(?!\sdark:text-)/g, 'text-gray-700 dark:text-gray-300');
    content = content.replace(/(?<!dark:)(?<!-)text-gray-600(?!\sdark:text-)/g, 'text-gray-600 dark:text-gray-400');
    content = content.replace(/(?<!dark:)(?<!-)text-gray-500(?!\sdark:text-)/g, 'text-gray-500 dark:text-gray-400');
    
    content = content.replace(/(?<!dark:)border-gray-200(?!\sdark:border-)/g, 'border-gray-200 dark:border-gray-700');
    content = content.replace(/(?<!dark:)border-gray-100(?!\sdark:border-)/g, 'border-gray-100 dark:border-gray-800');

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log('Updated: ' + p);
    }
  }
}

targetPaths.forEach(processPath);
