const fs = require('fs');
let file = fs.readFileSync('src/pages/ResetPassword.tsx', 'utf8');

// Replace standard t("key", "default") pattern with t.key || "default"
file = file.replace(/t\("([^"]+)",\s*"([^"]+)"\)/g, (match, p1, p2) => {
  // Convert "auth.passwordStrength.weak" into "t.auth?.passwordStrength?.weak"
  const dotStr = "t." + p1.split('.').join('?.');
  return `${dotStr} || "${p2}"`;
});

// Also correct cases where there might be \{t("x", "y")\} inside JSX placeholders
// Although the previous replace caught the raw function, it would produce {t.auth?.pwd || "def"} which is valid inside JSX interpolations.

fs.writeFileSync('src/pages/ResetPassword.tsx', file);
console.log('Done replacement');
