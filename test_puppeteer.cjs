const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:5173/admin/categories', { waitUntil: 'networkidle2' });
    console.log("Navigated to Categories");
    await page.waitForTimeout(2000);
    
    await browser.close();
  } catch (err) {
    console.error("Puppeteer error:", err);
  }
})();
