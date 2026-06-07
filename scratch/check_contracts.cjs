const fs = require('fs');

const envFile = 'c:/Users/pc/Desktop/workedin_tn/.env';
const envLocalFile = 'c:/Users/pc/Desktop/workedin_tn/.env.local';

function loadEnv(file) {
    if (fs.existsSync(file)) {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        for (const line of lines) {
            const m = line.match(/^\s*([^#=\s]+)\s*=\s*"?([^"\r\n]*)"?/);
            if (m) process.env[m[1]] = m[2];
        }
    }
}
loadEnv(envLocalFile);
loadEnv(envFile);

const { createClient } = require('c:/Users/pc/Desktop/workedin_tn/node_modules/@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    const { data: contracts } = await supabase.from('contracts').select('*');
    console.log('=== CONTRACTS ===');
    contracts.forEach(c => {
        console.log(`ID: ${c.id} | Title: "${c.title}" | Status: ${c.status}`);
    });
}
run();
