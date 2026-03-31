const fs = require('fs');
let c = fs.readFileSync('src/pages/VerifyEmail.tsx', 'utf8');
if (!c.includes('import DOMPurify')) {
    c = "import DOMPurify from 'dompurify';\n" + c;
    c = c.replace(/const email = searchParams\.get\('email'\) \|\| '';/, "const rawEmail = searchParams.get('email') || '';\n    const email = DOMPurify.sanitize(rawEmail);");
    fs.writeFileSync('src/pages/VerifyEmail.tsx', c);
}
