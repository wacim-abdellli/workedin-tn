const { chromium } = require('@playwright/test');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        page.on('console', msg => {
            console.log(`[BROWSER CONSOLE] ${msg.text()}`);
        });
        
        page.on('pageerror', err => {
            console.log(`[PAGE ERROR] ${err.toString()}`);
        });

        console.log('Navigating to auth...');
        await page.goto('http://localhost:5175/auth', { waitUntil: 'networkidle' });
        
        console.log('Typing credentials...');
        await page.fill('input[type="email"]', 'admin@khedma.tn');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        console.log('Waiting for login...');
        await page.waitForTimeout(3000);
        
        console.log('Navigating to messages...');
        await page.goto('http://localhost:5175/messages', { waitUntil: 'networkidle' });
        
        console.log('Observing for 10 seconds...');
        await page.waitForTimeout(10000);
        
        await browser.close();
        console.log('Done!');
    } catch (err) {
        console.error('Script error:', err);
        process.exit(1);
    }
})();
