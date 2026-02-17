import fs from 'fs/promises';
import path from 'path';
import { SCRAPER_CONFIG } from '../config/constants.js';

export async function ensureScreenshotDir(): Promise<void> {
  await fs.mkdir(SCRAPER_CONFIG.screenshotDir, { recursive: true });
}

export function generateScreenshotPath(prefectureId: string, type: 'detection' | 'error' = 'detection'): string {
  const timestamp = Date.now();
  const filename = `${type}_${prefectureId}_${timestamp}.png`;
  return path.join(SCRAPER_CONFIG.screenshotDir, filename);
}

export async function saveScreenshot(buffer: Buffer, filepath: string): Promise<string> {
  await ensureScreenshotDir();
  await fs.writeFile(filepath, buffer);
  return filepath;
}

export async function deleteScreenshot(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch {
    // Ignore errors if file doesn't exist
  }
}

export async function cleanupOldScreenshots(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const dir = SCRAPER_CONFIG.screenshotDir;
  let deletedCount = 0;

  try {
    const files = await fs.readdir(dir);
    const now = Date.now();

    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = await fs.stat(filepath);
      
      if (now - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(filepath);
        deletedCount++;
      }
    }
  } catch {
    // Directory might not exist yet
  }

  return deletedCount;
}
