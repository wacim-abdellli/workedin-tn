const fs = require('fs');

const mappingsRaw = fs.readFileSync('MISSING_TRANSLATIONS.json', 'utf8');
const mappingsDict = JSON.parse(mappingsRaw);

const flatMappings = {};
for (const [domain, items] of Object.entries(mappingsDict)) {
  for (const [key, langs] of Object.entries(items)) {
    flatMappings[langs.ar] = `t.${domain}?.${key}`;
  }
}

const filesToProcess = ['src/pages/JobDetail.tsx', 'src/pages/ContractWorkspace.tsx', 'src/pages/FAQ.tsx'];

filesToProcess.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [arabic, key] of Object.entries(flatMappings)) {
    if (content.includes(arabic)) {
      // Look for '"arabic"' or "'arabic'" and replace with "key || 'arabic'"
      // Or in JSX like `>arabic<`
      const safeArabic = arabic.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      const quoteRegex = new RegExp(`['"]${safeArabic}['"]`, 'g');
      if (quoteRegex.test(content)) {
        content = content.replace(quoteRegex, `${key} || '${arabic}'`);
        changed = true;
      }
      
      const jsxRegex = new RegExp(`>${safeArabic}<`, 'g');
      if (jsxRegex.test(content)) {
        content = content.replace(jsxRegex, `>{${key} || '${arabic}'}<`);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
});
