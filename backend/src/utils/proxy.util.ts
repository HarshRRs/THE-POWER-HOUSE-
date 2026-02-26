/**
 * Utility to manage and rotate Webshare proxies.
 */

import axios from 'axios';
import logger from './logger.util.js';

export interface ProxyConfig {
    server: string;
    username?: string;
    password?: string;
}

// In-memory cache for proxies so we don't hit the API on every single request
let cachedProxies: ProxyConfig[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Fetches the live list of proxies from the Webshare API.
 */
async function fetchProxiesFromWebshare(): Promise<ProxyConfig[]> {
    const token = process.env.WEBSHARE_API_TOKEN;
    if (!token) {
        logger.error("WEBSHARE_API_TOKEN is not set in .env! Cannot fetch proxies.");
        return [];
    }

    try {
        const response = await axios.get(
            'https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=100',
            {
                headers: {
                    Authorization: `Token ${token}`,
                },
            }
        );

        const proxies = response.data.results.map((proxy: any) => ({
            server: `http://${proxy.proxy_address}:${proxy.port}`,
            username: proxy.username,
            password: proxy.password
        }));

        logger.info(`Successfully fetched ${proxies.length} proxies from Webshare API.`);
        return proxies;
    } catch (error) {
        logger.error('Failed to fetch proxies from Webshare API', error);
        return [];
    }
}

/**
 * Returns a random proxy properly formatted for Playwright.
 * Uses an in-memory cache to avoid rate-limiting the Webshare API.
 */
export async function getRandomProxy(): Promise<ProxyConfig | null> {
    const now = Date.now();

    // Refresh cache if it's empty or older than TTL
    if (cachedProxies.length === 0 || now - lastFetchTime > CACHE_TTL_MS) {
        const fetched = await fetchProxiesFromWebshare();
        if (fetched.length > 0) {
            cachedProxies = fetched;
            lastFetchTime = now;
        }
    }

    if (cachedProxies.length === 0) {
        logger.warn("No proxies available! Running without proxy.");
        return null;
    }

    const randomIndex = Math.floor(Math.random() * cachedProxies.length);
    return cachedProxies[randomIndex];
}
