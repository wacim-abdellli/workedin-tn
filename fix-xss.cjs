const fs = require('fs');
let c = fs.readFileSync('src/pages/JobDetail.tsx', 'utf8');

c = c.replace(/import \{ Link, useParams, useNavigate \} from 'react-router-dom';/, "import { Link, useParams, useNavigate } from 'react-router-dom';\nimport DOMPurify from 'dompurify';");

c = c.replace(
    /<div className="prose max-w-none text-gray-400 mt-4 whitespace-pre-wrap">[\s\S]*?\{job\.description\}[\s\S]*?<\/div>/,
    '<div className="prose max-w-none text-gray-400 mt-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}></div>'
);

fs.writeFileSync('src/pages/JobDetail.tsx', c);
console.log('Done');