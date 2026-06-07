const { execSync } = require('child_process');

try {
    const reflog = execSync('git reflog', { encoding: 'utf8' });
    const shas = new Set();
    const lines = reflog.split('\n');
    for (const line of lines) {
        const match = line.match(/^([0-9a-f]+)\s/);
        if (match) {
            shas.add(match[1]);
        }
    }
    console.log(`Found ${shas.size} unique SHAs in reflog.`);
    for (const sha of shas) {
        try {
            const commitInfo = execSync(`git show -s --format="%h | %an | %ad | %s" ${sha}`, { encoding: 'utf8' }).trim();
            console.log(commitInfo);
        } catch (e) {
            // some SHAs might be reflog entries for invalid/pruned objects
        }
    }
} catch (err) {
    console.error(err);
}
