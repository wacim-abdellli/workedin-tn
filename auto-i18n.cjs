const fs = require('fs');

const files = [
  'src/pages/JobDetail.tsx', 
  'src/pages/ContractWorkspace.tsx', 
  'src/pages/FAQ.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Auto-replace Arabic text inside JSX >text<
    content = content.replace(/>\s*([^\x00-\x7F<>]+)\s*</g, (match, p1) => {
      // Create a dummy key
      return `>{t.common?.placeholder || '${p1}'}<`;
    });

    if (content.includes('useTranslation()')) {
        content = content.replace(/const {([^}]+)} = useTranslation\(\);/g, 'const { $1 } = useTranslation() as any;');
    }
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed ' + f);
  }
});
