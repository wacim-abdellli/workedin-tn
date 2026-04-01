const fs = require('fs');

function lazySentry(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove static imports
    content = content.replace(/import \* as Sentry from '@sentry\/react';\n/g, '');
    content = content.replace(/import \{ Sentry \} from '@\/lib\/sentry';\n/g, '');
    
    // Add dynamic sentry ref
    if (!content.includes('let Sentry: any')) {
        content = content.replace(/(class ErrorBoundaryInner extends Component[^{]*\{)/, `let Sentry: any = null;
if (import.meta.env.PROD) {
    import('@sentry/react').then(mod => Sentry = mod);
}

$1`);
    }

    // Wrap Sentry.captureException in condition
    content = content.replace(/Sentry\.captureException/g, 'Sentry?.captureException');
    
    fs.writeFileSync(file, content);
}

lazySentry('src/components/common/ErrorBoundary.tsx');
lazySentry('src/components/ui/ErrorBoundary.tsx');
console.log('Fixed sentry static imports');
