const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`[BROWSER CONSOLE] ${msg.text()}`);
        });
        
        page.on('pageerror', err => {
            console.log(`[PAGE ERROR] ${err.toString()}`);
        });

        console.log('Navigating to auth...');
        await page.goto('http://localhost:5175/auth', { waitUntil: 'networkidle2' });
        
        console.log('Typing credentials...');
        await page.type('input[type="email"]', 'admin@khedma.tn');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        console.log('Waiting for login...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => console.log('Nav timeout'));
        
        console.log('Navigating to messages...');
        await page.goto('http://localhost:5175/messages', { waitUntil: 'networkidle2' });
        
        console.log('Observing for 15 seconds...');
        await new Promise(r => setTimeout(r, 15000));
        
        await browser.close();
        console.log('Done!');
    } catch (err) {
        console.error('Script error:', err);
        process.exit(1);
    }
})();
