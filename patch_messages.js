const fs = require('fs');
let content = fs.readFileSync('src/pages/Messages.tsx', 'utf8');
content = content.replace(
  'const loadConversations = async () => {',
  'const loadConversations = async () => { console.log(\'loadConversations started\', user?.id);'
);
content = content.replace(
  'setIsLoadingConversations(false);',
  'console.log(\'loadConversations finished\'); setIsLoadingConversations(false);'
);
fs.writeFileSync('src/pages/Messages.tsx', content, 'utf8');
console.log('patched Messages.tsx');