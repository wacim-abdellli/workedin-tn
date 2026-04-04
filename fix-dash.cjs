const fs = require('fs');
let c = fs.readFileSync('src/index.css', 'utf8');

c = c.replace('--dash-bg: #0a0912;', '--dash-bg: #f9fafb;');
c = c.replace('--dash-card: #111019;', '--dash-card: #ffffff;');
c = c.replace('--dash-card-hover: #16141f;', '--dash-card-hover: #f3f4f6;');
c = c.replace('--dash-raised: #1a1826;', '--dash-raised: #ffffff;');
c = c.replace('--dash-border: rgba(255, 255, 255, 0.06);', '--dash-border: #e5e7eb;');
c = c.replace('--dash-border-hover: rgba(255, 255, 255, 0.12);', '--dash-border-hover: #d1d5db;');

const darkContent = `
  --dash-bg: #0a0912;
  --dash-card: #111019;
  --dash-card-hover: #16141f;
  --dash-raised: #1a1826;
  --dash-border: rgba(255, 255, 255, 0.06);
  --dash-border-hover: rgba(255, 255, 255, 0.12);
`;

c = c.replace(/\.dark\s*\{/, match => match + darkContent);

fs.writeFileSync('src/index.css', c);
