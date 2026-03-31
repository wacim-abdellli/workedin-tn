const fs = require('fs');
let c = fs.readFileSync('src/pages/JobBoard.tsx', 'utf8');

if (!c.includes('react-error-boundary')) {
    c = c.replace(
        /import \{ FilterSidebar, JobCard \} from '\.\.\/components\/jobs';/,
        "import { FilterSidebar, JobCard } from '../components/jobs';\nimport { ErrorBoundary } from 'react-error-boundary';\nimport { ErrorFallback } from '../components/ErrorFallback';"
    );
}

c = c.replace(
    /(<div className=\{`\$\{viewMode === 'grid' \? 'grid md:grid-cols-2 gap-4' : 'space-y-4'\} cv-auto`\}>[\s\S]*?jobCards\.map\(job => \([\s\S]*?<JobCard[\s\S]*?\/>[\s\S]*?\)[\s\S]*?<\/div>)/,
    `<ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
                                  $1
                                </ErrorBoundary>`
);

fs.writeFileSync('src/pages/JobBoard.tsx', c);
console.log('Fixed JobBoard ErrorBoundary');
