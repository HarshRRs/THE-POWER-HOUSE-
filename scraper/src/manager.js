/**
 * RDVPriority - Scraper Manager
 *
 * Distributes scraping jobs across workers using BullMQ.
 * Manages scheduling based on prefecture tier and check intervals.
 */

const { PREFECTURES } = require("./config/prefectures");

class ScraperManager {
    constructor() {
        this.jobs = new Map();
        this.results = [];
        console.log("📋 Scraper Manager initialized");
        console.log(`   → ${PREFECTURES.filter((p) => p.active).length} active prefectures`);
    }

    /**
     * Start scheduling jobs for all active prefectures
     */
    start() {
        console.log("\n🚀 Starting scraper manager...\n");

        const activePrefectures = PREFECTURES.filter((p) => p.active);

        // Group by tier for logging
        const tiers = { 1: [], 2: [], 3: [] };
        activePrefectures.forEach((p) => tiers[p.tier]?.push(p));

        console.log("📊 Prefecture tiers:");
        console.log(`   Tier 1 (Critical): ${tiers[1]?.map((p) => p.name).join(", ")}`);
        console.log(`   Tier 2 (High):     ${tiers[2]?.map((p) => p.name).join(", ")}`);
        console.log(`   Tier 3 (Medium):   ${tiers[3]?.map((p) => p.name).join(", ")}`);

        // Schedule each prefecture
        activePrefectures.forEach((prefecture) => {
            this.scheduleJob(prefecture);
        });

        console.log(`\n✅ ${activePrefectures.length} jobs scheduled\n`);
    }

    /**
     * Schedule a recurring job for a prefecture
     */
    scheduleJob(prefecture) {
        const intervalMs = prefecture.checkInterval * 1000;

        console.log(
            `  ⏰ Scheduled: ${prefecture.name} (every ${prefecture.checkInterval}s)`
        );

        // Initial check after random delay (0-30s) to spread load
        const initialDelay = Math.random() * 30000;

        setTimeout(() => {
            this.runJob(prefecture);
            const timer = setInterval(() => this.runJob(prefecture), intervalMs);
            this.jobs.set(prefecture.id, timer);
        }, initialDelay);
    }

    /**
     * Run a single scraping job
     */
    async runJob(prefecture) {
        const timestamp = new Date().toISOString();
        console.log(`\n🔍 [${timestamp}] Checking: ${prefecture.name} (${prefecture.department})`);
        console.log(`   URL: ${prefecture.bookingUrl}`);

        try {
            // Simulate scraping (replace with actual Playwright logic)
            const result = await this.simulateScrape(prefecture);

            if (result.slotsFound > 0) {
                console.log(`   🎉 SLOTS FOUND! ${result.slotsFound} available slots`);
                console.log(`   → Triggering notifications...`);
                this.results.push({
                    prefecture: prefecture.name,
                    department: prefecture.department,
                    slotsFound: result.slotsFound,
                    timestamp,
                });
            } else {
                console.log(`   ❌ No slots available`);
            }
        } catch (error) {
            console.error(`   ⚠️ Error checking ${prefecture.name}: ${error.message}`);
        }
    }

    /**
     * Simulate a scrape (replace with real Playwright in production)
     */
    async simulateScrape(prefecture) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1500));

        // 5% chance of finding slots (realistic simulation)
        const found = Math.random() < 0.05;
        return {
            slotsFound: found ? Math.floor(Math.random() * 5) + 1 : 0,
            checkedAt: new Date().toISOString(),
        };
    }

    /**
     * Stop all jobs
     */
    stop() {
        console.log("\n⏹️ Stopping all scraper jobs...");
        this.jobs.forEach((timer, id) => {
            clearInterval(timer);
            console.log(`   Stopped: ${id}`);
        });
        this.jobs.clear();
        console.log("✅ All jobs stopped\n");
    }

    /**
     * Get results summary
     */
    getResults() {
        return {
            totalDetections: this.results.length,
            results: this.results.slice(-50),
        };
    }
}

// Run if called directly
if (require.main === module) {
    const manager = new ScraperManager();
    manager.start();

    // Graceful shutdown
    process.on("SIGINT", () => {
        manager.stop();
        process.exit(0);
    });
}

module.exports = { ScraperManager };
