const { execSync } = require('child_process');
const fs = require('fs');

const log = execSync('git log -2 -p src/components/auth/AuthShell.tsx').toString();
fs.writeFileSync('gitlog.txt', log);
