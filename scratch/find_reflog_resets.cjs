const { execSync } = require('child_process');

try {
    const reflog = execSync('git reflog', { encoding: 'utf8' });
    const lines = reflog.split('\n');
    console.log('Resets and checkouts in reflog:');
    lines.forEach((line, idx) => {
        if (line.includes('checkout:') || line.includes('reset:') || line.includes('moving to')) {
            console.log(`${idx}: ${line}`);
        }
    });
} catch (e) {
    console.error(e);
}
