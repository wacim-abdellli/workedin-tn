const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<Route path="([^"]+)" element=\{<([a-zA-Z0-9]+)( \/)?>\} \/>/g;
content = content.replace(regex, (match, path, comp) => {
    // skip if comp is Navigate or Outlet or ErrorBoundary
    if (comp === 'Navigate' || comp === 'Outlet' || comp === 'ErrorBoundary') return match;
    return `<Route path="${path}" element={<ErrorBoundary><${comp} /></ErrorBoundary>} />`;
});

// Let's also wrap any existing elements without ErrorBoundary that are just pure components, e.g.:
// <Route path="/jobs" element={<JobBoard />} />

fs.writeFileSync('src/App.tsx', content);
console.log('Added Error Boundaries to App.tsx');
