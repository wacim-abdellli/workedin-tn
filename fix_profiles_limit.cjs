const fs = require('fs');
let code = fs.readFileSync('src/services/profiles.ts', 'utf8');

const regex = /\.select\(\`\*, freelancer_profiles\(\*\), portfolio_items\(\*\)\`\)/g;

code = code.replace(
  regex,
  `.select(\`*, freelancer_profiles(*), portfolio_items(*)\`)\n        .limit(20, { foreignTable: 'portfolio_items' })`
);

fs.writeFileSync('src/services/profiles.ts', code);
console.log('Fixed limit');