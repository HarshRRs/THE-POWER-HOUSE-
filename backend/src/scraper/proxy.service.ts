import logger from '../utils/logger.util.js';

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface ProxyProvider {
  name: string;
  getProxy(targetDomain?: string): ProxyConfig | null;
  reportFailure(proxy: ProxyConfig, targetDomain?: string): void;
  reportSuccess(proxy: ProxyConfig, targetDomain?: string): void;
}

/**
 * Residential proxy pool with rotation
 * Supports multiple proxy providers
 */
class ProxyService {
  private providers: ProxyProvider[] = [];
  private currentProviderIndex = 0;
  private enabled = false;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // ScraperAPI Integration
    if (process.env.SCRAPERAPI_KEY) {
      this.providers.push(new ScraperAPIProvider(process.env.SCRAPERAPI_KEY));
      logger.info('ProxyService: ScraperAPI provider initialized');
    }

    // Bright Data Integration
    if (process.env.BRIGHTDATA_USERNAME && process.env.BRIGHTDATA_PASSWORD) {
      this.providers.push(
        new BrightDataProvider(
          process.env.BRIGHTDATA_USERNAME,
          process.env.BRIGHTDATA_PASSWORD,
          process.env.BRIGHTDATA_HOST || 'brd.superproxy.io',
          parseInt(process.env.BRIGHTDATA_PORT || '22225', 10)
        )
      );
      logger.info('ProxyService: Bright Data provider initialized');
    }

    // Custom proxy list (comma-separated: host:port:user:pass)
    if (process.env.PROXY_LIST) {
      this.providers.push(new CustomProxyProvider(process.env.PROXY_LIST));
      logger.info('ProxyService: Custom proxy provider initialized');
    }

    this.enabled = this.providers.length > 0;

    if (!this.enabled) {
      logger.warn('ProxyService: No proxy providers configured. Running without proxies.');
      logger.warn('ProxyService: Set SCRAPERAPI_KEY, BRIGHTDATA_*, or PROXY_LIST to enable proxies.');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getProxy(targetDomain?: string): ProxyConfig | null {
    if (!this.enabled || this.providers.length === 0) {
      return null;
    }

    // Round-robin between providers
    const provider = this.providers[this.currentProviderIndex];
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;

    const proxy = provider.getProxy(targetDomain);
    if (proxy) {
      logger.debug(`ProxyService: Using proxy from ${provider.name}`);
    }
    return proxy;
  }

  reportFailure(proxy: ProxyConfig, targetDomain?: string): void {
    for (const provider of this.providers) {
      provider.reportFailure(proxy, targetDomain);
    }
  }

  reportSuccess(proxy: ProxyConfig, targetDomain?: string): void {
    for (const provider of this.providers) {
      provider.reportSuccess(proxy, targetDomain);
    }
  }

  getStats(): { enabled: boolean; providers: string[] } {
    return {
      enabled: this.enabled,
      providers: this.providers.map((p) => p.name),
    };
  }
}

/**
 * ScraperAPI - Handles proxies, CAPTCHAs, and retries automatically
 * https://www.scraperapi.com/
 */
class ScraperAPIProvider implements ProxyProvider {
  name = 'ScraperAPI';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getProxy(_targetDomain?: string): ProxyConfig {
    // ScraperAPI proxy endpoint
    return {
      server: 'http://proxy-server.scraperapi.com:8001',
      username: 'scraperapi',
      password: this.apiKey,
    };
  }

  reportFailure(_proxy?: ProxyConfig, _targetDomain?: string): void {
    // ScraperAPI handles its own retry logic
    logger.debug('ScraperAPI: Request failed (handled by provider)');
  }

  reportSuccess(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('ScraperAPI: Request succeeded');
  }
}

/**
 * Bright Data (formerly Luminati) - Enterprise proxy network
 * https://brightdata.com/
 */
class BrightDataProvider implements ProxyProvider {
  name = 'BrightData';
  private username: string;
  private password: string;
  private host: string;
  private port: number;
  private sessionCounter = 0;

  constructor(username: string, password: string, host: string, port: number) {
    this.username = username;
    this.password = password;
    this.host = host;
    this.port = port;
  }

  getProxy(_targetDomain?: string): ProxyConfig {
    // Rotate session ID for different IPs
    this.sessionCounter++;
    const sessionId = `session-${this.sessionCounter}-${Date.now()}`;

    return {
      server: `http://${this.host}:${this.port}`,
      username: `${this.username}-session-${sessionId}`,
      password: this.password,
    };
  }

  reportFailure(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('BrightData: Request failed, will rotate IP on next request');
  }

  reportSuccess(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('BrightData: Request succeeded');
  }
}

/**
 * Custom proxy list provider
 * Format: host:port:username:password,host:port:username:password,...
 */
class CustomProxyProvider implements ProxyProvider {
  name = 'CustomProxies';
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;
  // Tracking format: Map<ProxyKey, Map<DomainKey, { failures: number, cooldownUntil: number }>> 
  private domainStats: Map<string, Map<string, { failures: number; cooldownUntil: number }>> = new Map();
  private maxFailures = 3;
  private cooldownMs = 6 * 60 * 60 * 1000; // 6 hours cooldown

  constructor(proxyList: string) {
    this.parseProxyList(proxyList);
  }

  private parseProxyList(list: string): void {
    const entries = list.split(',').map((s) => s.trim()).filter(Boolean);

    for (const entry of entries) {
      const parts = entry.split(':');
      if (parts.length >= 2) {
        const proxy: ProxyConfig = {
          server: `http://${parts[0]}:${parts[1]}`,
        };
        if (parts[2]) proxy.username = parts[2];
        if (parts[3]) proxy.password = parts[3];
        this.proxies.push(proxy);
      }
    }

    logger.info(`CustomProxies: Loaded ${this.proxies.length} proxies`);
  }

  private getProxyKey(proxy: ProxyConfig): string {
    return proxy.server;
  }

  getProxy(targetDomain?: string): ProxyConfig | null {
    if (this.proxies.length === 0) return null;

    const domainKey = targetDomain || 'global';
    let attempts = 0;

    // Find a proxy that hasn't exceeded failure threshold on this domain
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      const proxyKey = this.getProxyKey(proxy);
      let proxyStats = this.domainStats.get(proxyKey);
      if (!proxyStats) {
        proxyStats = new Map();
        this.domainStats.set(proxyKey, proxyStats);
      }

      let stat = proxyStats.get(domainKey);
      if (!stat) {
        stat = { failures: 0, cooldownUntil: 0 };
        proxyStats.set(domainKey, stat);
      }

      const now = Date.now();

      if (stat.cooldownUntil > now) {
        // Still in cooldown for this domain
        attempts++;
        continue;
      } else if (stat.failures >= this.maxFailures) {
        // Cooldown finished, explicitly reset the counter
        stat.failures = 0;
        stat.cooldownUntil = 0;
      }

      // Valid proxy for this domain
      if (stat.failures < this.maxFailures) {
        return proxy;
      }
      attempts++;
    }

    // All proxies are in cooldown or failed for this domain. We fallback to returning the next to avoid complete stalling.
    logger.warn(`CustomProxies: All proxies in cooldown for ${domainKey}, ignoring cooldowns to try anyway...`);
    const fallback = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return fallback;
  }

  reportFailure(proxy: ProxyConfig, targetDomain?: string): void {
    const proxyKey = this.getProxyKey(proxy);
    const domainKey = targetDomain || 'global';

    let proxyStats = this.domainStats.get(proxyKey);
    if (!proxyStats) {
      proxyStats = new Map();
      this.domainStats.set(proxyKey, proxyStats);
    }

    let stat = proxyStats.get(domainKey);
    if (!stat) {
      stat = { failures: 0, cooldownUntil: 0 };
      proxyStats.set(domainKey, stat);
    }

    stat.failures += 1;
    logger.debug(`CustomProxies: Proxy ${proxyKey} failure count for ${domainKey}: ${stat.failures}`);

    if (stat.failures >= this.maxFailures && stat.cooldownUntil <= Date.now()) {
      stat.cooldownUntil = Date.now() + this.cooldownMs;
      logger.warn(`CustomProxies: Proxy ${proxyKey} has entered a ${this.cooldownMs / 1000 / 60 / 60} hour cooldown for ${domainKey}`);
    }
  }

  reportSuccess(proxy: ProxyConfig, targetDomain?: string): void {
    const proxyKey = this.getProxyKey(proxy);
    const domainKey = targetDomain || 'global';

    const proxyStats = this.domainStats.get(proxyKey);
    if (proxyStats) {
      proxyStats.delete(domainKey);
      if (proxyStats.size === 0) {
        this.domainStats.delete(proxyKey);
      }
    }
  }
}

// Singleton instance
export const proxyService = new ProxyService();
