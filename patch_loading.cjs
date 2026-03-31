const fs = require('fs');
let content = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

// Don't show loading spinner for background refreshes
content = content.replace(
  'setIsLoadingConversations(true);',
  'if (conversations.length === 0) setIsLoadingConversations(true);'
);

// Do the same for messages
content = content.replace(
  'setIsLoadingMessages(true);',
  'if (messages.length === 0) setIsLoadingMessages(true);'
);

fs.writeFileSync('src/pages/Messages.tsx', content, 'utf8');
console.log('loading states patched');