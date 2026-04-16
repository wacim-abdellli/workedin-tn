const fs = require('fs');

const extract = (file) => {
  const content = fs.readFileSync(file, 'utf8');
  const tRegex = /t\.contract\.(\w+)/g;
  const txRegex = /tx\('contract\.([a-zA-Z0-9_.]+)'(,\s*(undefined|\{.*?\}))?,\s*['"`](.+?)['"`]/gs;
  
  const matches = [];
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    if (!matches.some(m => m.key === match[1])) {
      matches.push({ key: match[1], fallback: match[1] });
    }
  }
  while ((match = txRegex.exec(content)) !== null) {
    if (!matches.some(m => m.key === match[1])) {
      matches.push({ key: match[1], fallback: match[4] });
    }
  }
  return matches;
}

const all = [
  ...extract('src/pages/ContractWorkspace.tsx'),
  ...extract('src/components/contracts/ContractDetailsSidebar.tsx'),
  ...extract('src/components/contracts/ChatSection.tsx')
];

let unique = {};
all.forEach(item => {
    // If we have a plain property access like 'status', but no text, just keep the key.
    if (!unique[item.key] || unique[item.key] === item.key) {
        unique[item.key] = item.fallback;
    }
});
console.log(JSON.stringify(unique, null, 2));
