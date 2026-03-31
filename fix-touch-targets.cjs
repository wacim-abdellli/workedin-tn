const fs = require('fs');

let indexCss = fs.readFileSync('src/index.css', 'utf8');
indexCss = indexCss.replace(/\.btn-sm \{\n\s*@apply([^;]+);\n\s*\}/, '.btn-sm {\n    @apply$1 min-h-[44px];\n  }');
indexCss = indexCss.replace(/\.btn-md \{\n\s*@apply([^;]+);\n\s*\}/, '.btn-md {\n    @apply$1 min-h-[44px];\n  }');
indexCss = indexCss.replace(/\.btn-lg \{\n\s*@apply([^;]+);\n\s*\}/, '.btn-lg {\n    @apply$1 min-h-[56px];\n  }');
if (!indexCss.includes('.btn {\n    @apply') && indexCss.includes('.btn {')) {
    indexCss = indexCss.replace(/\.btn\s*\{/, '.btn {\n    @apply min-w-[44px] min-h-[44px];');
}
fs.writeFileSync('src/index.css', indexCss);

let iconBtn = fs.readFileSync('src/components/ui/IconButton.tsx', 'utf8');
iconBtn = iconBtn.replace(/sm: 'w-9 h-9',/g, "sm: 'w-11 h-11 min-h-[44px] min-w-[44px]',");
iconBtn = iconBtn.replace(/md: 'w-11 h-11',/g, "md: 'w-12 h-12 min-h-[48px] min-w-[48px]',");
iconBtn = iconBtn.replace(/lg: 'w-14 h-14'/g, "lg: 'w-14 h-14 min-h-[56px] min-w-[56px]'");
iconBtn = iconBtn.replace(/className="w-5 h-5 animate-spin"/g, 'className="w-6 h-6 animate-spin"');
fs.writeFileSync('src/components/ui/IconButton.tsx', iconBtn);

let jobCardCss = fs.readFileSync('src/components/jobs/JobCard.tsx', 'utf8');
jobCardCss = jobCardCss.replace(/<Heart className=\{cn\('h-4 w-4/g, "<Heart className={cn('h-6 w-6");
fs.writeFileSync('src/components/jobs/JobCard.tsx', jobCardCss);

let filterSb = fs.readFileSync('src/components/jobs/FilterSidebar.tsx', 'utf8');
filterSb = filterSb.replace(/className="w-5 h-5/g, 'className="w-6 h-6');
filterSb = filterSb.replace(/className="flex\n?items-center gap-2 cursor-pointer group"/g, 'className="flex items-center gap-2 cursor-pointer group min-h-[44px] py-1"');
filterSb = filterSb.replace(/<button([^>]+onClick=\{onClearAll\}[^>]*)>/g, '<button$1 aria-label="Clear all filters" className="min-w-[44px] min-h-[44px] px-3">');

// Ensure Close button in mobile sidebar has min-size
filterSb = filterSb.replace(/<button\s*onClick=\{onClose\}\s*className="p-2/g, '<button onClick={onClose} aria-label="Close filters" className="p-2 min-w-[44px] min-h-[44px]');
fs.writeFileSync('src/components/jobs/FilterSidebar.tsx', filterSb);

let jobBoard = fs.readFileSync('src/pages/JobBoard.tsx', 'utf8');
jobBoard = jobBoard.replace(/w-5 h-5/g, 'w-6 h-6');
jobBoard = jobBoard.replace(/<button\s+type="button"\s+onClick=\{([^)]+)\}\s+aria-label="([^"]+)"\s*>/g, '<button type="button" onClick={$1} aria-label="$2" className="flex items-center justify-center p-2 min-w-[44px] min-h-[44px] hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg">');
// Re-format view all button to have min 44
jobBoard = jobBoard.replace(/'w-full text-center text-\[color:var\(--workspace-primary\)\] text-xs font-medium mt-4 p-2 rounded transition-colors',/g, "'w-full text-center text-[color:var(--workspace-primary)] text-xs font-medium mt-4 p-2 min-h-[44px] rounded transition-colors',");
fs.writeFileSync('src/pages/JobBoard.tsx', jobBoard);

console.log('Mobile touch targets updated');