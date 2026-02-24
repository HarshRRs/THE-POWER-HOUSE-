import { chromium } from 'playwright';

async function testPrefectureScraper() {
    console.log("🚀 Starting Bobigny Prefecture Scraper Test...");
    // Run in visible mode (headless: false) so the user can see it!
    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        const url = "https://www.seine-saint-denis.gouv.fr/booking/create";
        console.log(`🌐 Navigating to: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        console.log("✅ Page loaded successfully!");

        console.log("👀 Keeping browser open for 15 seconds so you can see it...");
        await page.waitForTimeout(15000);

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        console.log("🛑 Test completed. Closing browser.");
        await browser.close();
    }
}

testPrefectureScraper();

