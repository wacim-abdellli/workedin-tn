const fs = require('fs');

let c = fs.readFileSync('src/pages/JobBoard.tsx', 'utf8');

c = c.replace(
    /import \{ useState, useMemo, useEffect, useCallback \} from 'react';/,
    "import { useState, useMemo, useEffect, useCallback, useRef } from 'react';"
);

c = c.replace(
    /(\/\/ Update URL params\n\s*useEffect\(\(\) => \{\n)([\s\S]*?)(\n\s*\}, \[filters, setSearchParams\]\);)/,
    `// Update URL params
    const prevStr = useRef('');
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.search) params.set('q', filters.search);
        if (filters.categories.length) params.set('cat', filters.categories.join(','));
        if (filters.jobType) params.set('type', filters.jobType);
        if (filters.budgetRange) params.set('budget', filters.budgetRange);
        if (filters.experienceLevels.length) params.set('exp', filters.experienceLevels.join(','));
        if (filters.postedWithin !== 'any') params.set('posted', filters.postedWithin);
        if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
        
        const newStr = params.toString();
        if (prevStr.current !== newStr) {
            prevStr.current = newStr;
            setSearchParams(params, { replace: true });
        }
    }, [filters, setSearchParams]);`
);

fs.writeFileSync('src/pages/JobBoard.tsx', c);
console.log('Fixed JobBoard re-render loop');