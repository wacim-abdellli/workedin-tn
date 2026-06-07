const { execSync } = require('child_process');

try {
    const reflog = execSync('git reflog -n 100', { encoding: 'utf8' });
    const lines = reflog.split('\n');
    console.log('Reflog entries around 446:');
    for (let i = 30; i <= 60; i++) {
        if (lines[i]) {
            console.log(`${i}: ${lines[i]}`);
        }
    }
} catch (e) {
    console.error(e);
}
