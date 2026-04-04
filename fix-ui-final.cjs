const fs = require('fs');

const files = [
  'src/components/layout/Header/index.tsx',
  'src/components/home/JobCategories.tsx',
  'src/components/home/HeroSection.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/ui/SkeletonCard.tsx',
  'src/components/ui/SkeletonList.tsx',
  'src/pages/ClientDashboard.tsx',
  'src/pages/FreelancerDashboard.tsx',
  'src/components/settings/ProfileSettings.tsx'
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    
    // Add dark modes if missing
    c = c.replace(/bg-white([^a-z0-9\-])/g, (match, suffix) => {
        if(c.substring(c.indexOf(match), c.indexOf(match) + 20).includes('dark:bg')) return match;
        return 'bg-white dark:bg-gray-800' + suffix;
    });

    c = c.replace(/bg-gray-50([^a-z0-9\-])/g, (match, suffix) => {
        if(c.substring(c.indexOf(match), c.indexOf(match) + 20).includes('dark:bg')) return match;
        return 'bg-gray-50 dark:bg-gray-900' + suffix;
    });

    c = c.replace(/border-gray-200([^a-z0-9\-])/g, (match, suffix) => {
        if(c.substring(c.indexOf(match), c.indexOf(match) + 20).includes('dark:border')) return match;
        return 'border-gray-200 dark:border-gray-700' + suffix;
    });

    c = c.replace(/border-gray-100([^a-z0-9\-])/g, (match, suffix) => {
        if(c.substring(c.indexOf(match), c.indexOf(match) + 20).includes('dark:border')) return match;
        return 'border-gray-100 dark:border-gray-800' + suffix;
    });

    c = c.replace(/text-gray-900([^a-z0-9\-])/g, (match, suffix) => {
        if(c.substring(c.indexOf(match), c.indexOf(match) + 20).includes('dark:text')) return match;
        return 'text-gray-900 dark:text-gray-100' + suffix;
    });

    c = c.replace(/text-gray-800([^a-z0-9\-])/g, (match, suffix) => {
        if(c.substring(c.indexOf(match), c.indexOf(match) + 20).includes('dark:text')) return match;
        return 'text-gray-800 dark:text-gray-200' + suffix;
    });

    // Specifically for HeroSection Drop the Amateurs
    c = c.replace(/bg-white\/50/g, 'bg-white/50 dark:bg-gray-800/50');
    c = c.replace(/bg-white\/80/g, 'bg-white/80 dark:bg-gray-800/80');
    
    // Popup and Dropdowns
    c = c.replace(/bg-white shadow-xl/g, 'bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/50 dark:border dark:border-gray-700');
    c = c.replace(/bg-white shadow-lg/g, 'bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 dark:border dark:border-gray-700');

    // Skeletons
    c = c.replace(/bg-gray-200/g, 'bg-gray-200 dark:bg-gray-700');
    c = c.replace(/bg-gray-300/g, 'bg-gray-300 dark:bg-gray-600');
    
    // White background fixes that may have missed standard word boundary
    c = c.replace(/class="([^"]*)bg-white\b([^"]*)"/g, (m, pre, post) => {
        if (m.includes('dark:bg-')) return m;
        return `class="${pre}bg-white dark:bg-gray-800${post}"`;
    });

    c = c.replace(/className="([^"]*)bg-white\b([^"]*)"/g, (m, pre, post) => {
        if (m.includes('dark:bg-')) return m;
        return `className="${pre}bg-white dark:bg-gray-800${post}"`;
    });
    
    c = c.replace(/className=\{`([^`]*)bg-white\b([^`]*)`\}/g, (m, pre, post) => {
        if (m.includes('dark:bg-')) return m;
        return `className={\`${pre}bg-white dark:bg-gray-800${post}\`}`;
    });

    fs.writeFileSync(f, c);
    console.log('Patched: ' + f);
  } catch (e) {
    console.error('Err on ' + f + ': ' + e);
  }
});
