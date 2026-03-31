const fs = require('fs');
let c = fs.readFileSync('src/components/jobs/JobCard.tsx', 'utf8');

if (!c.includes('react-error-boundary')) {
    c = c.replace(
        "import React, { useState } from 'react';",
        "import React, { useState } from 'react';\nimport { ErrorBoundary } from 'react-error-boundary';\nimport { JobCardErrorFallback } from '../ErrorFallback';"
    );
}

c = c.replace(
    /export default React\.memo\(JobCard\);/,
    `const JobCardErrorBoundary = (props: JobCardProps) => (
  <ErrorBoundary FallbackComponent={JobCardErrorFallback}>
    <JobCard {...props} />
  </ErrorBoundary>
);

export default React.memo(JobCardErrorBoundary);`
);

fs.writeFileSync('src/components/jobs/JobCard.tsx', c);
console.log('Fixed JobCard ErrorBoundary');