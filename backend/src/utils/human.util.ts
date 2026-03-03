/**
 * Human-like behavior simulation utilities
 * Inspired by Botasaurus framework patterns
 * 
 * These functions simulate realistic human interaction patterns
 * including bezier-curved mouse movements, per-character typing,
 * and natural scroll behavior.
 */
import type { Page } from 'playwright';
import { randomDelay } from './retry.util.js';
import logger from './logger.util.js';

/**
 * Move mouse to an element using bezier-like smoothstep easing
 * Simulates natural human hand movement (acceleration + deceleration)
 */
export async function humanMove(page: Page, selector: string): Promise<void> {
  try {
    // Use page.locator() instead of page.$() to support Playwright-specific
    // selectors like :has-text(), :nth-match(), etc.
    const box = await page.locator(selector).first().boundingBox({ timeout: 3000 });
    if (!box) return;

    const viewport = page.viewportSize();
    if (!viewport) return;

    // Target: center of element with slight random offset
    const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
    const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

    // Start from a random position near center of viewport
    const startX = viewport.width * (0.3 + Math.random() * 0.4);
    const startY = viewport.height * (0.3 + Math.random() * 0.4);

    // Move in 3-5 steps with smoothstep easing (bezier-like curve)
    const steps = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Smoothstep: acceleration then deceleration
      const eased = t * t * (3 - 2 * t);
      const x = startX + (targetX - startX) * eased;
      const y = startY + (targetY - startY) * eased;
      await page.mouse.move(x, y);
      await randomDelay(20, 80);
    }
  } catch {
    // Non-critical: fall back to no mouse movement
  }
}

/**
 * Click an element with human-like mouse movement + press/release timing
 */
export async function humanClick(page: Page, selector: string): Promise<void> {
  try {
    await humanMove(page, selector);
    await randomDelay(50, 150);
    await page.mouse.down();
    await randomDelay(30, 100);
    await page.mouse.up();
  } catch {
    // Fall back to standard click
    try {
      await page.click(selector);
    } catch {
      logger.debug(`humanClick: Could not click ${selector}`);
    }
  }
}

/**
 * Type text with human-like per-character delays and occasional pauses
 * Simulates natural typing rhythm with variable speed
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  try {
    await humanClick(page, selector);
    await randomDelay(200, 500);

    for (const char of text) {
      await page.keyboard.type(char, { delay: 50 + Math.random() * 150 });
      // 10% chance of a brief thinking pause (like a human hesitating)
      if (Math.random() < 0.1) {
        await randomDelay(300, 800);
      }
    }
  } catch {
    // Fall back to standard fill
    try {
      await page.fill(selector, text);
    } catch {
      logger.debug(`humanType: Could not type into ${selector}`);
    }
  }
}

/**
 * Scroll the page naturally like a human reading content
 * Random number of scroll actions with variable distances
 */
export async function humanScroll(page: Page): Promise<void> {
  try {
    const scrolls = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < scrolls; i++) {
      const distance = 100 + Math.floor(Math.random() * 300);
      await page.mouse.wheel(0, distance);
      await randomDelay(300, 800);
    }
  } catch {
    // Non-critical: page may not need scrolling
  }
}

/**
 * Simulate reading a page: scroll, pause, maybe scroll back up a bit
 */
export async function humanReadPage(page: Page): Promise<void> {
  try {
    // Initial reading pause
    await randomDelay(500, 1500);

    // Scroll down to read
    await humanScroll(page);

    // 30% chance to scroll back up slightly (like re-reading)
    if (Math.random() < 0.3) {
      const upDistance = -(50 + Math.floor(Math.random() * 150));
      await page.mouse.wheel(0, upDistance);
      await randomDelay(200, 500);
    }
  } catch {
    // Non-critical
  }
}
