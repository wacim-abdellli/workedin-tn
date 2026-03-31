const fs = require('fs');
let c = fs.readFileSync('src/pages/JobBoard.tsx', 'utf8');
c = c.replace(/'p-2 transition-colors',/g, "'p-2 min-w-[44px] min-h-[44px] transition-colors',");
c = c.replace(/className="p-1 rounded-full/g, 'className="p-1 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center');
fs.writeFileSync('src/pages/JobBoard.tsx', c);
