const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let original = fs.readFileSync(fullPath, 'utf8');
      let content = original.replace(/dark:bg-white dark:bg-gray-800(\/[0-9]+)?/g, 'dark:white$1'); // Uh wait.
      // 1. If it was `dark:bg-white/5`, it became `dark:bg-white dark:bg-gray-800/5`
      // So replacing `dark:bg-white dark:bg-gray-800(\/[0-9]+)?` with `dark:bg-white$1`
      content = content.replace(/dark:bg-white dark:bg-gray-[0-9]+(\/[0-9]+)?/g, 'dark:bg-white$1');
      content = content.replace(/dark:hover:bg-white dark:hover:bg-gray-[0-9]+(\/[0-9]+)?/g, 'dark:hover:bg-white$1');
      
      // Let's also check if standard `bg-white dark:bg-gray-800` was applied to the bell itself correctly,
      // because we DO want `bg-white dark:bg-gray-800` for the modal or button background, but not if it's supposed to be translucent white in dark mode.
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log('Cleaned up: ' + fullPath);
      }
    }
  }
}

walk('src');
