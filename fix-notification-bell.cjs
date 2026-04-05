const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/dark:white\/([0-9]+)/g, 'dark:bg-white/$1');
      content = content.replace(/dark:white([ "'`]|$)/g, 'dark:bg-white$1');
      
      // Also for NotificationBell, let's fix its actual styling.
      if (fullPath.includes('NotificationBell.tsx')) {
         // Button wrapper itself is "bg-white dark:bg-gray-800/80 dark:border-white/8 dark:bg-white/5" 
         // which is crazy.
         // Let's replace the whole header-icon-btn line or replace these combinations.
         content = content.replace(/bg-white dark:bg-gray-800\/80 dark:border-white\/8([^"']*?)dark:bg-white\/[0-9]+/, 'bg-white dark:bg-gray-800/80 dark:border-white/10');
         
         // The empty state container 
         content = content.replace(/bg-brand-light text-brand dark:bg-white\/5 dark:text-brand-mid/g, 'bg-brand-light text-brand dark:bg-gray-800 dark:text-brand-mid');
         
         // The item states
         // hover:border-gray-100 dark:border-gray-800 hover:bg-brand-light/40 dark:hover:border-white/10 dark:hover:bg-white/5
         content = content.replace(/dark:hover:bg-white\/5/g, 'dark:hover:bg-gray-800');
         
         // Unread states
         content = content.replace(/dark:border-transparent dark:bg-white\/5 dark:text-brand-mid/g, 'dark:border-transparent dark:bg-gray-800 dark:text-brand-mid');
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

walk(path.join(__dirname, 'src'));
