const { execSync } = require('child_process');

try {
    const mainContent = execSync('git show main:src/pages/Messages.tsx', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const branchContent = execSync('git show agents/master-bug-fix-plan-creation:src/pages/Messages.tsx', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    console.log('Main branch length:', mainContent.length);
    console.log('Agent branch length:', branchContent.length);

    // Let's find accentClasses definition in both
    const findAccentClasses = (content) => {
        const idx = content.indexOf('const accentClasses = useMemo');
        if (idx !== -1) {
            return content.substring(idx, idx + 1500);
        }
        return 'Not found';
    };

    console.log('=== Accent Classes in MAIN ===');
    console.log(findAccentClasses(mainContent));

    console.log('=== Accent Classes in BRANCH ===');
    console.log(findAccentClasses(branchContent));

} catch (err) {
    console.error(err);
}
