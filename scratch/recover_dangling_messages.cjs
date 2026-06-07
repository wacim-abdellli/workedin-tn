const fs = require('fs');
const path = require('path');

async function run() {
    const dir = 'c:\\Users\\pc\\Desktop\\workedin_tn\\.git\\lost-found\\other';
    if (!fs.existsSync(dir)) {
        console.log('No lost-found/other directory found.');
        return;
    }
    const files = fs.readdirSync(dir);
    console.log(`Found ${files.length} dangling files.`);
    let foundCount = 0;
    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('function MessagesComponent(') || content.includes('function MessagesComponent()')) {
                foundCount++;
                console.log(`Found match in dangling file: ${file}`);
                console.log(`Length: ${content.length}`);
                console.log(`Preview of start:\n${content.substring(0, 300)}`);
                const dest = `c:\\Users\\pc\\Desktop\\workedin_tn\\scratch\\recovered_messages_${file}.tsx`;
                fs.writeFileSync(dest, content);
                console.log(`Wrote to: ${dest}`);
            }
        } catch (e) {
            // not text or error reading
        }
    }
    console.log(`Done. Found ${foundCount} matches.`);
}

run().catch(console.error);
