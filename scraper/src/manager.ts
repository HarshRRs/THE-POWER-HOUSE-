import { PREFECTURES } from './config/prefectures';
import { PrefectureConfig, ScrapeResult } from './types';
import { ScraperWorker } from './worker';

/**
 * RDVPriority - Scraper Manager
 *
 * Distributes scraping jobs across workers.
 * Manages scheduling based on prefecture tier and check intervals.
 */

export class ScraperManager {
    private jobs: Map<string, NodeJS.Timeout>;
    private results: Array<{
        prefecture: string;
        department: string;
        slotsFound: number;
        timestamp: string;
        error?: string;
    }>;

    constructor() {
        this.jobs = new Map();
        this.results = [];
        console.log('📋 Scraper Manager initialized');
        console.log(`   → ${PREFECTURES.filter((p) => p.active).length} active prefectures`);
    }

    /**
     * Start scheduling jobs for all active prefectures
     */
    start(): void {
        console.log('\n🚀 Starting scraper manager...\n');

        const activePrefectures = PREFECTURES.filter((p) => p.active);

        // Group by tier for logging
        const tiers: Record<number, PrefectureConfig[]> = { 1: [], 2: [], 3: [] };
        activePrefectures.forEach((p) => {
            if (tiers[p.tier]) {
                tiers[p.tier].push(p);
            }
        });

        console.log('📊 Prefecture tiers:');
        console.log(`   Tier 1 (Critical): ${tiers[1]?.map((p) => p.name).join(', ') || 'None'}`);
        console.log(`   Tier 2 (High):     ${tiers[2]?.map((p) => p.name).join(', ') || 'None'}`);
        console.log(`   Tier 3 (Medium):   ${tiers[3]?.map((p) => p.name).join(', ') || 'None'}`);

        // Schedule each prefecture
        activePrefectures.forEach((prefecture) => {
            this.scheduleJob(prefecture);
        });

        console.log(`\n✅ ${activePrefectures.length} jobs scheduled\n`);
    }

    /**
     * Schedule a recurring job for a prefecture
     */
    private scheduleJob(prefecture: PrefectureConfig): void {
        const intervalMs = prefecture.checkInterval * 1000;

        console.log(`  ⏰ Scheduled: ${prefecture.name} (every ${prefecture.checkInterval}s)`);

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
    private async runJob(prefecture: PrefectureConfig): Promise<void> {
        const timestamp = new Date().toISOString();
        console.log(`\n🔍 [${timestamp}] Checking: ${prefecture.name} (${prefecture.department})`);
        console.log(`   URL: ${prefecture.bookingUrl}`);

        const worker = new ScraperWorker(prefecture);

        try {
            await worker.init();
            const result = await worker.checkAvailability();

            if (result.slotsFound > 0) {
                console.log(`   🎉 SLOTS FOUND! ${result.slotsFound} available slots`);
                console.log(`   → Triggering notifications...`);
                this.recordResult(prefecture, result.slotsFound, timestamp);
            } else if (result.error) {
                console.log(`   ⚠️ Error: ${result.error}`);
                this.recordResult(prefecture, 0, timestamp, result.error);
            } else {
                console.log(`   ❌ No slots available`);
            }
        } catch (error) {
            console.error(`   ⚠️ Critical error checking ${prefecture.name}: ${error instanceof Error ? error.message : error}`);
        } finally {
            await worker.close();
        }
    }

    private recordResult(prefecture: PrefectureConfig, slotsFound: number, timestamp: string, error?: string): void {
        this.results.push({
            prefecture: prefecture.name,
            department: prefecture.department,
            slotsFound,
            timestamp,
            error
        });

        // Keep list bounded
        if (this.results.length > 1000) {
            this.results = this.results.slice(-500);
        }
    }

    /**
     * Stop all jobs
     */
    stop(): void {
        console.log('\n⏹️ Stopping all scraper jobs...');
        this.jobs.forEach((timer, id) => {
            clearInterval(timer);
            console.log(`   Stopped: ${id}`);
        });
        this.jobs.clear();
        console.log('✅ All jobs stopped\n');
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
    process.on('SIGINT', () => {
        manager.stop();
        process.exit(0);
    });
}
