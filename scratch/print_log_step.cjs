const fs = require('fs');
const readline = require('readline');

const stepNum = parseInt(process.argv[2], 10);
if (isNaN(stepNum)) {
    console.error('Usage: node print_log_step.cjs <step_number>');
    process.exit(1);
}

async function run() {
    const logPath = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\8b9209ae-472f-4adc-b1ce-8c3ea91127d6\\.system_generated\\logs\\transcript.jsonl';
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let index = 0;
    for await (const line of rl) {
        index++;
        if (index === stepNum) {
            console.log(JSON.stringify(JSON.parse(line), null, 2));
            break;
        }
    }
}

run().catch(console.error);
