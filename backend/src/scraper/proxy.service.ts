import logger from '../utils/logger.util.js';

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

export interface ProxyProvider {
  name: string;
  getProxy(targetDomain?: string): ProxyConfig | null;
  getProxyExcluding(excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null;
  reportFailure(proxy: ProxyConfig, targetDomain?: string): void;
  reportSuccess(proxy: ProxyConfig, targetDomain?: string): void;
}

/**
 * Residential proxy pool with rotation
 * Supports multiple proxy providers with weighted selection
 */
class ProxyService {
  private providers: { provider: ProxyProvider; weight: number }[] = [];
  private enabled = false;

  /** Default weights per provider name */
  private static readonly PROVIDER_WEIGHTS: Record<string, number> = {
    CustomProxies: 60,
    BrightData: 30,
    SmartProxy: 10,
    ScraperAPI: 20,
  };

  constructor() {
    this.initializeProviders();
  }

  private addProvider(provider: ProxyProvider): void {
    const weight = ProxyService.PROVIDER_WEIGHTS[provider.name] ?? 20;
    this.providers.push({ provider, weight });
  }

  private initializeProviders(): void {
    // ScraperAPI Integration
    if (process.env.SCRAPERAPI_KEY) {
      this.addProvider(new ScraperAPIProvider(process.env.SCRAPERAPI_KEY));
      logger.info('ProxyService: ScraperAPI provider initialized');
    }

    // Bright Data Integration
    if (process.env.BRIGHTDATA_USERNAME && process.env.BRIGHTDATA_PASSWORD) {
      this.addProvider(
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
      this.addProvider(new CustomProxyProvider(process.env.PROXY_LIST));
      logger.info('ProxyService: Custom proxy provider initialized');
    }

    // SmartProxy residential proxy integration (French IPs)
    if (process.env.SMARTPROXY_USERNAME && process.env.SMARTPROXY_PASSWORD) {
      this.addProvider(
        new SmartProxyProvider(
          process.env.SMARTPROXY_USERNAME,
          process.env.SMARTPROXY_PASSWORD,
          process.env.SMARTPROXY_COUNTRY || 'fr',
          process.env.SMARTPROXY_CITY,
        )
      );
      logger.info('ProxyService: SmartProxy residential provider initialized');
    }

    // Tor SOCKS5 proxy — FREE, no account needed
    // Requires the tor sidecar container (dperson/torproxy) in docker-compose.prod.yml
    if (process.env.TOR_ENABLED === 'true') {
      const torUrl = process.env.TOR_PROXY_URL || 'socks5://tor:9050';
      this.addProvider(new TorProxyProvider(torUrl));
      logger.info(`ProxyService: Tor provider initialized (${torUrl})`);
    }

    this.enabled = this.providers.length > 0;

    if (!this.enabled) {
      logger.warn('ProxyService: No proxy providers configured. Running without proxies.');
      logger.warn('ProxyService: Set SCRAPERAPI_KEY, BRIGHTDATA_*, PROXY_LIST, or SMARTPROXY_* to enable proxies.');
    } else {
      const providerList = this.providers.map(p => `${p.provider.name}(w=${p.weight})`).join(', ');
      logger.info(`ProxyService: ${this.providers.length} providers ready: ${providerList}`);
    }
  }

  /** Weighted random provider selection */
  private selectProvider(): ProxyProvider | null {
    if (this.providers.length === 0) return null;
    const totalWeight = this.providers.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of this.providers) {
      roll -= entry.weight;
      if (roll <= 0) return entry.provider;
    }
    return this.providers[this.providers.length - 1].provider;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getProxy(targetDomain?: string): ProxyConfig | null {
    if (!this.enabled) return null;

    const provider = this.selectProvider();
    if (!provider) return null;

    const proxy = provider.getProxy(targetDomain);
    if (proxy) {
      logger.debug(`ProxyService: Using proxy from ${provider.name}`);
    }
    return proxy;
  }

  reportFailure(proxy: ProxyConfig, targetDomain?: string): void {
    for (const { provider } of this.providers) {
      provider.reportFailure(proxy, targetDomain);
    }
  }

  reportSuccess(proxy: ProxyConfig, targetDomain?: string): void {
    for (const { provider } of this.providers) {
      provider.reportSuccess(proxy, targetDomain);
    }
  }

  getProxyExcluding(excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null {
    if (!this.enabled) return null;

    const provider = this.selectProvider();
    if (!provider) return null;

    const proxy = provider.getProxyExcluding(excludedServers, targetDomain);
    if (proxy) {
      logger.debug(`ProxyService: Using proxy from ${provider.name} (excluding ${excludedServers.size} proxies)`);
    }
    return proxy;
  }

  getStats(): { enabled: boolean; providers: string[] } {
    return {
      enabled: this.enabled,
      providers: this.providers.map((p) => p.provider.name),
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

  getProxyExcluding(_excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null {
    return this.getProxy(targetDomain);
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

  getProxyExcluding(_excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null {
    return this.getProxy(targetDomain);
  }

  reportFailure(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('BrightData: Request failed, will rotate IP on next request');
  }

  reportSuccess(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('BrightData: Request succeeded');
  }
}

/**
 * SmartProxy - Residential proxy network with geo-targeting
 * https://smartproxy.com/
 *
 * Uses session-based rotation for sticky French IPs.
 * Gateway: gate.smartproxy.com:7000
 */
class SmartProxyProvider implements ProxyProvider {
  name = 'SmartProxy';
  private username: string;
  private password: string;
  private country: string;
  private city?: string;
  private sessionCounter = 0;

  constructor(username: string, password: string, country: string, city?: string) {
    this.username = username;
    this.password = password;
    this.country = country;
    this.city = city;
  }

  getProxy(_targetDomain?: string): ProxyConfig {
    this.sessionCounter++;
    // SmartProxy session format: user-country-fr-session-<id>
    let sessionUser = `${this.username}-country-${this.country}`;
    if (this.city) {
      sessionUser += `-city-${this.city}`;
    }
    sessionUser += `-session-${this.sessionCounter}${Date.now()}`;

    return {
      server: 'http://gate.smartproxy.com:7000',
      username: sessionUser,
      password: this.password,
    };
  }

  getProxyExcluding(_excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null {
    // SmartProxy always rotates, so exclusion doesn't apply
    return this.getProxy(targetDomain);
  }

  reportFailure(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('SmartProxy: Request failed, will rotate IP on next request');
  }

  reportSuccess(_proxy?: ProxyConfig, _targetDomain?: string): void {
    logger.debug('SmartProxy: Request succeeded');
  }
}

/**
 * Health stats per proxy-domain pair.
 * - healthScore: 0 (dead) to 100 (perfect)
 * - consecutiveFailures: drives exponential backoff
 * - cooldownUntil: timestamp when proxy becomes eligible again
 * - lastFailureTime: used for gradual health recovery
 * - requestTimestamps: sliding window for rate limiting
 */
interface ProxyHealthStats {
  healthScore: number;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastFailureTime: number;
  requestTimestamps: number[];
}

/**
 * Custom proxy list provider with health scoring
 * Format: host:port:username:password,host:port:username:password,...
 *
 * Features:
 * - Health score (0-100) per proxy per domain
 * - Exponential backoff: 5min * 2^(failures-1), capped at 2 hours
 * - Gradual recovery: +10 health/min after cooldown expires
 * - Rate limiting: max 5 requests/min per proxy per domain
 * - Weighted random selection: higher health = higher selection probability
 */
class CustomProxyProvider implements ProxyProvider {
  name = 'CustomProxies';
  private proxies: ProxyConfig[] = [];
  // Map<proxyServer, Map<domainKey, ProxyHealthStats>>
  private domainStats: Map<string, Map<string, ProxyHealthStats>> = new Map();

  private static readonly BASE_COOLDOWN_MS = 5 * 60 * 1000;   // 5 minutes
  private static readonly MAX_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly HEALTH_RECOVERY_PER_MIN = 10;
  private static readonly HEALTH_PENALTY_PER_FAILURE = 25;
  private static readonly MAX_REQUESTS_PER_MIN = 5;
  private static readonly RATE_WINDOW_MS = 60 * 1000;

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

  private getStats(proxyServer: string, domainKey: string): ProxyHealthStats {
    let proxyMap = this.domainStats.get(proxyServer);
    if (!proxyMap) {
      proxyMap = new Map();
      this.domainStats.set(proxyServer, proxyMap);
    }
    let stats = proxyMap.get(domainKey);
    if (!stats) {
      stats = { healthScore: 100, consecutiveFailures: 0, cooldownUntil: 0, lastFailureTime: 0, requestTimestamps: [] };
      proxyMap.set(domainKey, stats);
    }
    return stats;
  }

  /** Apply gradual health recovery if cooldown has expired */
  private applyRecovery(stats: ProxyHealthStats, now: number): void {
    if (stats.cooldownUntil > 0 && now >= stats.cooldownUntil && stats.healthScore < 100) {
      const minutesSinceCooldown = (now - stats.cooldownUntil) / 60_000;
      const recovered = Math.floor(minutesSinceCooldown * CustomProxyProvider.HEALTH_RECOVERY_PER_MIN);
      if (recovered > 0) {
        stats.healthScore = Math.min(100, stats.healthScore + recovered);
        if (stats.healthScore >= 80) {
          // Fully recovered - reset failure tracking
          stats.consecutiveFailures = 0;
          stats.cooldownUntil = 0;
        }
      }
    }
  }

  /** Check if proxy is rate-limited for the given domain */
  private isRateLimited(stats: ProxyHealthStats, now: number): boolean {
    const cutoff = now - CustomProxyProvider.RATE_WINDOW_MS;
    stats.requestTimestamps = stats.requestTimestamps.filter(t => t > cutoff);
    return stats.requestTimestamps.length >= CustomProxyProvider.MAX_REQUESTS_PER_MIN;
  }

  /** Record a request timestamp for rate limiting */
  private recordRequest(stats: ProxyHealthStats, now: number): void {
    stats.requestTimestamps.push(now);
  }

  /**
   * Weighted random selection: pick a proxy based on health score.
   * Higher health = proportionally higher chance of being selected.
   */
  private selectWeighted(candidates: { proxy: ProxyConfig; health: number }[]): ProxyConfig | null {
    if (candidates.length === 0) return null;

    const totalWeight = candidates.reduce((sum, c) => sum + Math.max(c.health, 1), 0);
    let roll = Math.random() * totalWeight;

    for (const c of candidates) {
      roll -= Math.max(c.health, 1);
      if (roll <= 0) return c.proxy;
    }
    return candidates[candidates.length - 1].proxy;
  }

  private getCandidates(domainKey: string, excludedServers?: Set<string>): { proxy: ProxyConfig; health: number }[] {
    const now = Date.now();
    const candidates: { proxy: ProxyConfig; health: number }[] = [];

    for (const proxy of this.proxies) {
      if (excludedServers?.has(proxy.server)) continue;

      const stats = this.getStats(proxy.server, domainKey);
      this.applyRecovery(stats, now);

      // Skip if still in active cooldown
      if (stats.cooldownUntil > now) continue;

      // Skip if rate-limited
      if (this.isRateLimited(stats, now)) continue;

      candidates.push({ proxy, health: stats.healthScore });
    }

    return candidates;
  }

  getProxy(targetDomain?: string): ProxyConfig | null {
    if (this.proxies.length === 0) return null;

    const domainKey = targetDomain || 'global';
    const candidates = this.getCandidates(domainKey);

    if (candidates.length > 0) {
      const selected = this.selectWeighted(candidates)!;
      const stats = this.getStats(selected.server, domainKey);
      this.recordRequest(stats, Date.now());
      return selected;
    }

    // All proxies in cooldown or rate-limited. Pick the one with the earliest cooldown expiry.
    logger.warn(`CustomProxies: All proxies unavailable for ${domainKey}, selecting least-penalized fallback`);
    let bestProxy = this.proxies[0];
    let earliestCooldown = Infinity;
    for (const proxy of this.proxies) {
      const stats = this.getStats(proxy.server, domainKey);
      if (stats.cooldownUntil < earliestCooldown) {
        earliestCooldown = stats.cooldownUntil;
        bestProxy = proxy;
      }
    }
    return bestProxy;
  }

  reportFailure(proxy: ProxyConfig, targetDomain?: string): void {
    const domainKey = targetDomain || 'global';
    const stats = this.getStats(proxy.server, domainKey);
    const now = Date.now();

    stats.consecutiveFailures += 1;
    stats.lastFailureTime = now;
    stats.healthScore = Math.max(0, stats.healthScore - CustomProxyProvider.HEALTH_PENALTY_PER_FAILURE);

    // Exponential backoff: 5min * 2^(failures-1), capped at 2 hours, with jitter
    const backoff = Math.min(
      CustomProxyProvider.BASE_COOLDOWN_MS * Math.pow(2, stats.consecutiveFailures - 1),
      CustomProxyProvider.MAX_COOLDOWN_MS,
    );
    const jitter = Math.random() * 0.2 * backoff; // 0-20% jitter
    stats.cooldownUntil = now + backoff + jitter;

    const cooldownSec = Math.round((backoff + jitter) / 1000);
    logger.warn(
      `CustomProxies: ${proxy.server} health=${stats.healthScore} failures=${stats.consecutiveFailures} ` +
      `cooldown=${cooldownSec}s for ${domainKey}`,
    );
  }

  reportSuccess(proxy: ProxyConfig, targetDomain?: string): void {
    const domainKey = targetDomain || 'global';
    const stats = this.getStats(proxy.server, domainKey);

    // Reward: restore health, reset failure streak
    stats.consecutiveFailures = 0;
    stats.cooldownUntil = 0;
    stats.healthScore = Math.min(100, stats.healthScore + 10);
  }

  getProxyExcluding(excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null {
    if (this.proxies.length === 0) return null;

    const domainKey = targetDomain || 'global';
    const candidates = this.getCandidates(domainKey, excludedServers);

    if (candidates.length > 0) {
      const selected = this.selectWeighted(candidates)!;
      const stats = this.getStats(selected.server, domainKey);
      this.recordRequest(stats, Date.now());
      return selected;
    }

    // Fallback: pick least-penalized non-excluded proxy
    let bestProxy: ProxyConfig | null = null;
    let earliestCooldown = Infinity;
    for (const proxy of this.proxies) {
      if (excludedServers.has(proxy.server)) continue;
      const stats = this.getStats(proxy.server, domainKey);
      if (stats.cooldownUntil < earliestCooldown) {
        earliestCooldown = stats.cooldownUntil;
        bestProxy = proxy;
      }
    }

    if (bestProxy) {
      logger.warn(`CustomProxies: All non-excluded proxies unavailable for ${domainKey}, using least-penalized fallback`);
      return bestProxy;
    }

    // All proxies excluded entirely, fall back to regular selection
    logger.warn(`CustomProxies: All proxies excluded, falling back to regular selection`);
    return this.getProxy(targetDomain);
  }
}

/**
 * Tor SOCKS5 proxy provider — FREE IP rotation, no account needed.
 *
 * Tor automatically rotates the exit node (and therefore the egress IP)
 * roughly every 10 minutes. No credentials are required.
 *
 * Usage:
 *   1. Add the tor sidecar to docker-compose.prod.yml (dperson/torproxy)
 *   2. Set TOR_ENABLED=true in your environment
 *   3. Optionally override TOR_PROXY_URL (default: socks5://tor:9050)
 *
 * Limitations:
 *   - Tor exit nodes are occasionally blacklisted by government sites.
 *     The proxy service will report the failure so the next attempt skips Tor.
 *   - Tor is slower (~500 ms extra latency) but sufficient for prefecture scraping.
 */
class TorProxyProvider implements ProxyProvider {
  name = 'Tor';
  private proxyUrl: string;
  private failureCount = 0;
  private cooldownUntil = 0;

  private static readonly MAX_CONSECUTIVE_FAILURES = 5;
  private static readonly COOLDOWN_MS = 10 * 60 * 1000; // 10 min

  constructor(proxyUrl: string) {
    this.proxyUrl = proxyUrl;
  }

  getProxy(_targetDomain?: string): ProxyConfig | null {
    const now = Date.now();
    if (this.cooldownUntil > now) {
      logger.debug(`Tor: in cooldown for ${Math.round((this.cooldownUntil - now) / 1000)}s`);
      return null;
    }
    return { server: this.proxyUrl };
  }

  getProxyExcluding(_excludedServers: Set<string>, targetDomain?: string): ProxyConfig | null {
    return this.getProxy(targetDomain);
  }

  reportFailure(_proxy: ProxyConfig, _targetDomain?: string): void {
    this.failureCount++;
    logger.warn(`Tor: failure #${this.failureCount}`);

    if (this.failureCount >= TorProxyProvider.MAX_CONSECUTIVE_FAILURES) {
      this.cooldownUntil = Date.now() + TorProxyProvider.COOLDOWN_MS;
      this.failureCount = 0;
      logger.warn(`Tor: too many failures — pausing for ${TorProxyProvider.COOLDOWN_MS / 60000} min`);
    }
  }

  reportSuccess(_proxy: ProxyConfig, _targetDomain?: string): void {
    this.failureCount = 0;
    logger.debug('Tor: request succeeded');
  }
}

// Singleton instance
export const proxyService = new ProxyService();

