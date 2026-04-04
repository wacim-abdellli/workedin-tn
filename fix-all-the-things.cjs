const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/components',
  'src/pages'
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let original = fs.readFileSync(fullPath, 'utf8');
      let c = original;

      let prev;
      do {
          prev = c;
          c = c.replace(/className="([^"]+)"/g, (m, cn) => {
              let newCn = cn;
              ['bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'border-gray-100', 'border-gray-200', 'border-white/10'].forEach(cls => {
                const darkEquivalent = {
                  'bg-white': 'dark:bg-gray-800',
                  'bg-gray-50': 'dark:bg-gray-900',
                  'bg-gray-100': 'dark:bg-gray-800',
                  'bg-gray-200': 'dark:bg-gray-700',
                  'border-gray-100': 'dark:border-gray-800',
                  'border-gray-200': 'dark:border-gray-700',
                  'border-white/10': 'dark:border-gray-800'
                }[cls];
                if (newCn.includes(cls) && !newCn.includes(darkEquivalent)) {
                    newCn = newCn.replace(new RegExp(`\\bdark:bg-slate-[^\\s]+\\b`, 'g'), '');
                    newCn = newCn.replace(new RegExp(`\\b${cls}\\b(?!.*${darkEquivalent})`, 'g'), `${cls} ${darkEquivalent}`);
                }
              });

              ['text-gray-900', 'text-gray-800', 'text-gray-700'].forEach(cls => {
                const darkEquivalent = {
                  'text-gray-900': 'dark:text-gray-100',
                  'text-gray-800': 'dark:text-gray-200',
                  'text-gray-700': 'dark:text-gray-300'
                }[cls];
                if (newCn.includes(cls) && !newCn.includes(darkEquivalent)) {
                    newCn = newCn.replace(new RegExp(`\\b${cls}\\b(?!.*${darkEquivalent})`, 'g'), `${cls} ${darkEquivalent}`);
                }
              });
              
              if (cn !== newCn) return `className="${newCn.replace(/\s+/g, ' ')}"`;
              return m;
          });
          
          c = c.replace(/className=\{[^\}]+['`"](.*?)['`"][^\}]+\}/gs, (m) => {
            // we will just do a standard replace for strings inside
            let newM = m;
            ['bg-white', 'bg-gray-50', 'bg-gray-200', 'border-white/10', 'border-gray-100', 'border-gray-200'].forEach(cls => {
               const dark = {
                  'bg-white': 'dark:bg-gray-800',
                  'bg-gray-50': 'dark:bg-gray-900',
                  'bg-gray-200': 'dark:bg-gray-700',
                  'border-white/10': 'dark:border-gray-800',
                  'border-gray-100': 'dark:border-gray-800',
                  'border-gray-200': 'dark:border-gray-700'
                }[cls];
               if (newM.includes(cls) && !newM.includes(dark)) {
                 newM = newM.replace(new RegExp(`\\b${cls}\\b`, 'g'), `${cls} ${dark}`);
               }
            });
            ['text-gray-900', 'text-gray-800'].forEach(cls => {
               const dark = {
                  'text-gray-900': 'dark:text-gray-100',
                  'text-gray-800': 'dark:text-gray-200',
                }[cls];
               if (newM.includes(cls) && !newM.includes(dark)) {
                 newM = newM.replace(new RegExp(`\\b${cls}\\b`, 'g'), `${cls} ${dark}`);
               }
            });
            return newM;
          });

      } while(c !== prev);

      // Raw replacements for specific blobs
      if (c.includes('bg-white/20') && !c.includes('dark:bg-gray-900/20')) c = c.replace(/bg-white\/20/g, 'bg-white/20 dark:bg-gray-900/20');
      if (c.includes('border-white/30') && !c.includes('dark:border-gray-800/30')) c = c.replace(/border-white\/30/g, 'border-white/30 dark:border-gray-800/30');
      
      if (c.includes('dark:bg-slate-900/[0.02]')) c = c.replace(/dark:bg-slate-900\/\[0\.02\]/g, 'dark:bg-gray-900');
      if (c.includes('dark:bg-slate-900/5')) c = c.replace(/dark:bg-slate-900\/5/g, 'dark:bg-gray-800');
      if (c.includes('dark:bg-slate-900/10')) c = c.replace(/dark:bg-slate-900\/10/g, 'dark:bg-gray-700');

      if (c !== original) {
        fs.writeFileSync(fullPath, c, 'utf8');
        console.log('Fixed => ' + fullPath);
      }
    }
  }
}

targetDirs.forEach(processDir);
console.log('Sweep completed.');