const fs = require('fs');

const indexHtml = 'index.html';
let content = fs.readFileSync(indexHtml, 'utf8');

if (!content.includes('Content-Security-Policy')) {
    content = content.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.flouci.com; media-src 'self' https://*.supabase.co https://*.supabase.in; form-action 'self'; frame-ancestors 'none';" />`
    );
    fs.writeFileSync(indexHtml, content);
}
console.log('CSP added');

const chatSection = 'src/components/contracts/ChatSection.tsx';
let chatContent = fs.readFileSync(chatSection, 'utf8');

if (!chatContent.includes('DOMPurify')) {
    chatContent = chatContent.replace(
        "import { useTranslation } from '../../i18n';",
        "import { useTranslation } from '../../i18n';\nimport DOMPurify from 'dompurify';"
    );
    
    // Replace text render logic 1: system messages (bg-gray-200)
    chatContent = chatContent.replace(
        /<span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">\s*\{message\.content\}\s*<\/span>/,
        `<span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />`
    );

    // Replace text render logic 2: chat bubble messages
    chatContent = chatContent.replace(
        /\{message\.content && <p className="leading-relaxed whitespace-pre-wrap">\{message\.content\}<\/p>\}/g,
        `{message.content && <div className="leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />}`
    );
    
    fs.writeFileSync(chatSection, chatContent);
}

console.log('DOMPurify added');
