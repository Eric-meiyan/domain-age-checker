import * as dns from 'dns';
import * as net from 'net';
import { promises as fs } from 'fs';
import path from 'path';
import { TldConfig, Tld, fetchTlds } from '../models/TldModel';
import { normalizeKeyword } from '../lib/keywordUtils';

// 定义域名检查结果接口
export interface DomainCheckResult {
  domain: string;
  available: boolean;
  tld: string;
  timestamp: number;
  error?: string;
  rdapData?: any; // 存储RDAP响应数据（可选）
  method?: 'RDAP' | 'WHOIS' | 'WHOIS (RDAP fallback)' | 'Unknown'; // 表示使用的查询方法
}

// 缓存数据接口
interface RdapCache {
  timestamp: number;
  serverMap: Record<string, string[]>;
}

export class DomainCheckService {
  private tldConfigs: TldConfig[] = [];
  private rdapServerMap: Map<string, string[]> = new Map(); // TLD到RDAP服务器URL的映射
  private lastUpdateTime: number = 0;
  private updateInProgress: boolean = false;
  private cacheFilePath: string;
  private rdapErrorCount: number = 0;
  private rdapTotalCount: number = 0;
  
  constructor() {
    this.cacheFilePath = path.join(process.cwd(), 'app/data/rdap-cache.json');
  }
  
  /**
   * 初始化服务，加载RDAP配置
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Domain Check Service...');
      
          // 1. 尝试加载缓存数据
    const cacheLoaded = await this.loadCachedRdapData();
    console.log(`Cache loaded: ${cacheLoaded ? 'Yes' : 'No'}`);
    console.log(`lastUpdateTime after cache load: ${this.lastUpdateTime}`);
    console.log(`RDAP server map size after cache load: ${this.rdapServerMap.size}`);
    
    // 2. 确保关键TLD有RDAP服务器
    this.ensureCriticalTlds();
    console.log(`RDAP server map size after ensureCriticalTlds: ${this.rdapServerMap.size}`);
      
      // 3. 设置定期更新任务
      this.schedulePeriodicUpdate();
      
          // 4. 检查是否需要立即更新数据
    if (!cacheLoaded || this.isCacheStale()) {
      console.log('Cache is stale or missing, updating RDAP data...');
      // 启动时更新，但使用较短超时 - 添加 await！
      const updateSuccess = await this.updateRdapData(true);
      console.log(`RDAP update completed: ${updateSuccess ? 'Success' : 'Failed'}`);
      console.log(`RDAP server map size after update: ${this.rdapServerMap.size}`);
    }
      
      // 5. 从RDAP服务器信息生成tldConfigs（为了兼容性）
      this.generateTldConfigsFromRdap();
      
      console.log(`RDAP Server Map has ${this.rdapServerMap.size} entries`);
      console.log('Domain Check Service initialization completed');
    } catch (error) {
      console.error('Failed to initialize Domain Check Service:', error);
      
      // 确保至少有基本的TLD配置
      this.ensureCriticalTlds();
      this.generateTldConfigsFromRdap();
      
      throw new Error('Failed to initialize Domain Check Service');
    }
  }
  
  /**
   * 调度定期更新任务 - 每周执行一次
   */
  private schedulePeriodicUpdate(): void {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    
    // 在生产环境中使用setInterval
    // 对于开发环境，可以使用更短的间隔进行测试
    const updateInterval = process.env.NODE_ENV === 'development' ? 
      24 * 60 * 60 * 1000 : // 开发环境：1天
      WEEK_MS;              // 生产环境：1周
    
    console.log(`Scheduling periodic RDAP data update every ${updateInterval/1000/60/60} hours`);
    
    setInterval(() => {
      console.log('Running scheduled RDAP data update');
      this.updateRdapData(false);
    }, updateInterval);
  }
  
  /**
   * 检查缓存是否过期
   */
  private isCacheStale(): boolean {
    // 如果从未更新过，应该被认为是过期的
    if (this.lastUpdateTime === 0) {
      console.log('Cache is stale: never updated (lastUpdateTime = 0)');
      return true;
    }
    
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const age = Date.now() - this.lastUpdateTime;
    const isStale = age > THIRTY_DAYS_MS;
    
    if (isStale) {
      console.log(`Cache is stale. Age: ${Math.round(age/1000/60/60)} hours`);
    }
    
    return isStale;
  }
  
  /**
   * 根据错误率触发更新
   */
  private maybeUpdateBasedOnErrors(errors: number, total: number): void {
    if (total === 0) return;
    
    const errorRate = errors / total;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const timeSinceLastUpdate = Date.now() - this.lastUpdateTime;
    
    // 如果错误率高于30%且上次更新是在24小时前
    if (errorRate > 0.3 && timeSinceLastUpdate > ONE_DAY_MS) {
      console.log(`High error rate detected (${Math.round(errorRate*100)}%), triggering RDAP data update`);
      this.updateRdapData(false);
    }
  }
  
  /**
   * 从IANA获取最新的RDAP数据
   */
  private async updateRdapData(isStartup: boolean = false): Promise<boolean> {
    if (this.updateInProgress) {
      console.log('Update already in progress, skipping');
      return false;
    }
    
    this.updateInProgress = true;
    try {
      console.log('Updating RDAP data from IANA...');
      
      const timeout = isStartup ? 5000 : 30000; // 启动时使用更短的超时
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const tldResponse = await fetchTlds();
        clearTimeout(timeoutId);
        
        if (tldResponse.success && tldResponse.data.length > 0) {
          console.log(`Received ${tldResponse.data.length} TLDs from IANA`);
          
          // 更新RDAP服务器映射
          let updatedCount = 0;
          tldResponse.data.forEach(tld => {
            if (tld.rdapServers && tld.rdapServers.length > 0) {
              this.rdapServerMap.set(tld.name, tld.rdapServers);
              updatedCount++;
            }
          });
          
          // 确保关键TLD信息
          this.ensureCriticalTlds();
          
          // 更新配置和时间戳
          this.lastUpdateTime = Date.now();
          this.generateTldConfigsFromRdap();
          
          // 保存到缓存
          await this.saveCachedRdapData();
          
          console.log(`RDAP data updated successfully. ${updatedCount} TLDs with RDAP servers.`);
          return true;
        } else {
          throw new Error(`Failed to fetch TLD data from IANA: ${tldResponse.error || 'Unknown error'}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          console.warn(`RDAP data update timed out after ${timeout}ms`);
        } else {
          console.error('Error fetching RDAP data:', fetchError);
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.warn('RDAP data update failed, using existing data', error);
      return false;
    } finally {
      this.updateInProgress = false;
    }
  }
  
  /**
   * 保存RDAP数据到缓存文件
   */
  private async saveCachedRdapData(): Promise<void> {
    try {
      // 确保目录存在
      const cacheDir = path.dirname(this.cacheFilePath);
      await fs.mkdir(cacheDir, { recursive: true });
      
      // 将Map转换为普通对象以便序列化
      const serverMapObj: Record<string, string[]> = {};
      this.rdapServerMap.forEach((servers, tld) => {
        serverMapObj[tld] = servers;
      });
      
      const cacheData: RdapCache = {
        timestamp: this.lastUpdateTime,
        serverMap: serverMapObj
      };
      
      await fs.writeFile(this.cacheFilePath, JSON.stringify(cacheData, null, 2), 'utf8');
      console.log(`RDAP cache saved to ${this.cacheFilePath}`);
    } catch (error) {
      console.error('Failed to save RDAP cache:', error);
    }
  }
  
  /**
   * 从缓存文件加载RDAP数据
   */
  private async loadCachedRdapData(): Promise<boolean> {
    try {
      console.log(`Trying to load RDAP cache from ${this.cacheFilePath}`);
      
      const data = await fs.readFile(this.cacheFilePath, 'utf8');
      const cache: RdapCache = JSON.parse(data);
      
      if (!cache.timestamp || !cache.serverMap) {
        throw new Error('Invalid cache format');
      }
      
      // 从缓存恢复数据
      this.lastUpdateTime = cache.timestamp;
      this.rdapServerMap.clear();
      
      for (const [tld, servers] of Object.entries(cache.serverMap)) {
        if (Array.isArray(servers) && servers.length > 0) {
          this.rdapServerMap.set(tld, servers);
        }
      }
      
      const cacheAge = Math.round((Date.now() - this.lastUpdateTime) / (1000 * 60 * 60));
      console.log(`RDAP cache loaded successfully. ${this.rdapServerMap.size} TLDs. Cache age: ${cacheAge} hours`);
      
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('RDAP cache file not found, will create new cache');
      } else {
        console.error('Failed to load RDAP cache:', error);
      }
      return false;
    }
  }
  
  /**
   * 确保常用TLD有RDAP/WHOIS服务器配置
   */
  private ensureCriticalTlds(): void {
    // 定义关键TLD及其RDAP/WHOIS服务器
    const criticalTlds: Record<string, string[]> = {
      // RDAP servers
      'com': ['https://rdap.verisign.com/com/v1/', 'https://rdap.markmonitor.com/rdap/'],
      'net': ['https://rdap.verisign.com/net/v1/'],
      'org': ['https://rdap.publicinterestregistry.org/rdap/'],
      'io': ['https://rdap.nic.io/'],
      'app': ['https://rdap.google/rdap/'],
      'dev': ['https://rdap.google/rdap/'],
      'ai': ['https://rdap.nic.ai/'],
      'co': ['https://rdap.nic.co/'],
      'me': ['https://rdap.nic.me/'],
      'xyz': ['https://rdap.nic.xyz/'],
      'tech': ['https://rdap.nic.tech/'],
      'site': ['https://rdap.centralnic.com/site/'],
      'online': ['https://rdap.centralnic.com/online/'],
      'store': ['https://rdap.centralnic.com/store/'],
      'shop': ['https://rdap.centralnic.com/shop/']
    };
    
    // 确保这些TLD的RDAP服务器存在
    for (const [tld, rdapServers] of Object.entries(criticalTlds)) {
      // 仅当RDAP服务器列表为空或不存在时才使用硬编码的值
      if (!this.rdapServerMap.has(tld) || this.rdapServerMap.get(tld)?.length === 0) {
        console.log(`Adding hardcoded RDAP servers for critical TLD: ${tld}`);
        this.rdapServerMap.set(tld, rdapServers);
      }
    }
    
    // 为TLDs添加WHOIS配置（用于后备）
    const whoisConfigs: Record<string, [string, string]> = {
      'com': ['whois.verisign-grs.com', 'No match for'],
      'net': ['whois.verisign-grs.com', 'No match for'],
      'org': ['whois.pir.org', 'NOT FOUND'],
      'io': ['whois.nic.io', 'is available for purchase'],
      'co': ['whois.nic.co', 'Not found'],
      'me': ['whois.nic.me', 'NOT FOUND'],
      'ai': ['whois.nic.ai', 'No Object Found'],
      'xyz': ['whois.nic.xyz', 'DOMAIN NOT FOUND'],
      'tech': ['whois.nic.tech', 'DOMAIN NOT FOUND'],
      'app': ['whois.nic.google', 'Domain not found'],
      'dev': ['whois.nic.google', 'Domain not found']
    };
    
    // 确保tldConfigs包含这些关键TLD
    for (const [tld, [server, pattern]] of Object.entries(whoisConfigs)) {
      const existingConfig = this.tldConfigs.find(config => config.name === tld);
      
      if (!existingConfig) {
        const displayName = `.${tld}`;
        
        // 添加新的TLD配置
        console.log(`Adding critical TLD config for: ${tld}`);
        this.tldConfigs.push({
          name: tld,
          server,
          availablePattern: pattern,
          enabled: true,
          displayName
        });
      }
    }
    
    console.log(`Ensured ${Object.keys(criticalTlds).length} critical TLDs have RDAP servers`);
    console.log(`Ensured ${Object.keys(whoisConfigs).length} critical TLDs have WHOIS fallback`);
  }
  
  /**
   * 从RDAP服务器映射生成TLD配置
   */
  private generateTldConfigsFromRdap(): void {
    this.tldConfigs = [];
    
    this.rdapServerMap.forEach((servers, tldName) => {
      if (servers.length > 0) {
        this.tldConfigs.push({
          name: tldName,
          server: servers[0],
          availablePattern: "404 Not Found", // RDAP中表示域名不存在的模式
          enabled: true,
          displayName: `.${tldName}`
        });
      }
    });
    
    console.log(`Generated ${this.tldConfigs.length} TLD configurations from RDAP server map`);
  }
  
  /**
   * 获取所有可用的TLD配置
   */
  getEnabledTlds(): TldConfig[] {
    return this.tldConfigs.filter(tld => tld.enabled);
  }
  
  /**
   * 检查多个关键词在多个TLD下的域名可用性
   */
  async checkDomains(keywords: string[], tlds: string[]): Promise<DomainCheckResult[]> {
    console.log(`Checking domains with ${keywords.length} keywords and ${tlds.length} TLDs`);
    
    // Validate inputs
    if (!keywords || keywords.length === 0) {
      throw new Error('No keywords provided');
    }
    
    if (!tlds || tlds.length === 0) {
      throw new Error('No TLDs provided');
    }
    
    // Clean up inputs - remove empty strings and duplicates
    const validKeywords = [...new Set(keywords.filter(k => typeof k === 'string' && k.trim().length > 0))];
    const validTlds = [...new Set(tlds.filter(t => typeof t === 'string' && t.trim().length > 0))];
    
    if (validKeywords.length === 0) {
      throw new Error('No valid keywords after filtering');
    }
    
    if (validTlds.length === 0) {
      throw new Error('No valid TLDs after filtering');
    }
    
    // Create all combinations of keywords and TLDs
    const domainCombinations: Array<{keyword: string, tld: string}> = [];
    
    for (const keyword of validKeywords) {
      for (const tld of validTlds) {
        // Form a valid domain name: normalize the keyword and remove any existing TLD parts
        const normalizedKeyword = normalizeKeyword(keyword);
        
        if (normalizedKeyword) {
          domainCombinations.push({
            keyword: normalizedKeyword,
            tld
          });
        }
      }
    }
    
    // Check each domain combination
    const results: DomainCheckResult[] = [];
    const errors: { domain: string, error: string }[] = [];
    
    // Use Promise.all with proper concurrency control
    const batchSize = 5; // Process 5 domains at a time
    
    for (let i = 0; i < domainCombinations.length; i += batchSize) {
      const batch = domainCombinations.slice(i, i + batchSize);
      
      // Process this batch
      const batchResults = await Promise.all(batch.map(async ({ keyword, tld }) => {
        const domainName = `${keyword}.${tld}`;
        
        try {
          // First try RDAP method
          const result = await this.checkSingleDomainRdap(domainName, tld);
          
          // If RDAP failed with an error, try falling back to WHOIS
          if (result.error) {
            console.log(`RDAP check failed for ${domainName}, attempting WHOIS fallback`);
            
            // Find the WHOIS configuration for this TLD
            const tldConfig = this.tldConfigs.find(config => config.name === tld);
            
            if (tldConfig?.server && tldConfig.availablePattern) {
              try {
                const whoisResult = await this.checkSingleDomainWhois(
                  domainName,
                  tldConfig.server,
                  tldConfig.availablePattern,
                  tld
                );
                
                // Use WHOIS result but note that we fell back
                whoisResult.method = 'WHOIS (RDAP fallback)';
                return whoisResult;
              } catch (whoisError) {
                // If WHOIS also fails, return original RDAP error but note both failed
                const whoisErrorMsg = whoisError instanceof Error ? whoisError.message : 'Unknown error';
                result.error = `${result.error}. WHOIS fallback also failed: ${whoisErrorMsg}`;
                return result;
              }
            } else {
              // No WHOIS configuration available, return original RDAP error
              return result;
            }
          }
          
          return result;
        } catch (error) {
          console.error(`Error checking domain ${domainName}:`, error);
          
          // Record the error
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ domain: domainName, error: errorMsg });
          
          // Return a standardized error result
          return {
            domain: domainName,
            tld,
            available: false,
            timestamp: Date.now(),
            error: errorMsg,
            method: 'Unknown' as const
          };
        }
      }));
      
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the servers
      if (i + batchSize < domainCombinations.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Log stats about the checks
    const available = results.filter(r => r.available).length;
    const unavailable = results.filter(r => !r.available && !r.error).length;
    const errored = results.filter(r => Boolean(r.error)).length;
    
    console.log(`Domain check completed: ${results.length} total, ${available} available, ${unavailable} unavailable, ${errored} errors`);
    
    if (errors.length > 0) {
      console.warn(`Errors occurred during domain checks:`, errors);
    }
    
    return results;
  }
  
  /**
   * 解析RDAP响应中的时间信息
   */
  private parseRdapTimeData(rdapData: any): {
    registrationDate?: string;
    expirationDate?: string;
    lastChangedDate?: string;
    domainAge?: number;
  } {
    const result: {
      registrationDate?: string;
      expirationDate?: string;
      lastChangedDate?: string;
      domainAge?: number;
    } = {};

    if (!rdapData || !rdapData.events) {
      return result;
    }

    // 解析events数组中的时间信息
    rdapData.events.forEach((event: any) => {
      if (!event.eventAction || !event.eventDate) return;

      switch (event.eventAction.toLowerCase()) {
        case 'registration':
          result.registrationDate = event.eventDate;
          break;
        case 'expiration':
          result.expirationDate = event.eventDate;
          break;
        case 'last changed':
        case 'last update':
          result.lastChangedDate = event.eventDate;
          break;
      }
    });

    // 计算域名年龄
    if (result.registrationDate) {
      try {
        const regDate = new Date(result.registrationDate);
        const now = new Date();
        const diffTime = now.getTime() - regDate.getTime();
        result.domainAge = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 转换为天数
      } catch (error) {
        console.warn('Error calculating domain age:', error);
      }
    }

    return result;
  }

  /**
   * 使用RDAP协议检查单个域名的可用性
   */
  private async checkSingleDomainRdap(
    domain: string,
    tld: string
  ): Promise<DomainCheckResult> {
    const servers = this.rdapServerMap.get(tld);
    if (!servers || servers.length === 0) {
      return {
        domain,
        tld,
        available: false,
        timestamp: Date.now(),
        error: `No RDAP servers available for TLD: ${tld}`,
        method: 'RDAP'
      };
    }
    
    // Store all errors to provide detailed information if all servers fail
    const errors: string[] = [];
    
    // Try each RDAP server until we get a successful response
    for (const baseUrl of servers) {
      try {
        console.log(`Checking domain ${domain} using RDAP server: ${baseUrl}`);
        
        // Prepare the RDAP URL - ensure base URL ends with a slash
        const rdapUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}domain/${domain}`;
        
        // Create a timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(rdapUrl, { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/rdap+json'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.status === 404) {
            // 404 typically means the domain is available (not found in registry)
            return {
              domain,
              tld,
              available: true,
              timestamp: Date.now(),
              method: 'RDAP'
            };
          } else if (response.status === 200) {
            // 200 means the domain exists (is registered)
            // Optionally fetch the full data if needed
            let rdapData = null;
            try {
              rdapData = await response.json();
            } catch (jsonError) {
              console.warn(`Error parsing RDAP JSON for ${domain}:`, jsonError);
            }
            
            // 解析RDAP时间数据
            const timeData = this.parseRdapTimeData(rdapData);
            
            return {
              domain,
              tld,
              available: false,
              timestamp: Date.now(),
              rdapData,
              method: 'RDAP',
              ...timeData
            };
          } else {
            // Other status codes are treated as errors
            const errorBody = await response.text().catch(() => 'Could not read response body');
            const errorMsg = `RDAP server responded with status ${response.status}: ${errorBody.substring(0, 100)}`;
            console.warn(errorMsg);
            errors.push(errorMsg);
            
            // Continue to the next server
            continue;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
            const errorMsg = `RDAP request timed out for ${rdapUrl}`;
            console.warn(errorMsg);
            errors.push(errorMsg);
          } else {
            const errorMsg = `RDAP fetch error for ${rdapUrl}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`;
            console.warn(errorMsg);
            errors.push(errorMsg);
          }
          
          // Continue to the next server
          continue;
        }
      } catch (error) {
        const errorMsg = `RDAP general error for ${domain} using ${baseUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
        
        // Continue to the next server
        continue;
      }
    }
    
    // If we get here, all RDAP servers failed
    console.error(`All RDAP servers failed for ${domain}. Errors: ${errors.join('; ')}`);
    
    // Increment error count for potential update triggering
    this.rdapErrorCount = (this.rdapErrorCount || 0) + 1;
    this.rdapTotalCount = (this.rdapTotalCount || 0) + 1;
    
    // If error rate is high, consider triggering an update
    if (this.rdapErrorCount > 0 && this.rdapTotalCount > 10) {
      this.maybeUpdateBasedOnErrors(this.rdapErrorCount, this.rdapTotalCount);
    }
    
    return {
      domain,
      tld,
      available: false,
      timestamp: Date.now(),
      error: `All RDAP servers failed: ${errors.join('; ')}`,
      method: 'RDAP'
    };
  }
  
  /**
   * 使用WHOIS协议检查单个域名的可用性（作为备用方法）
   */
  private async checkSingleDomainWhois(
    domain: string, 
    whoisServer: string, 
    availablePattern: string,
    tld: string
  ): Promise<DomainCheckResult> {
    console.log(`Checking domain via WHOIS: ${domain} (server: ${whoisServer}, pattern: "${availablePattern}")`);
    
    const result: DomainCheckResult = {
      domain,
      available: false,
      tld,
      timestamp: Date.now(),
      method: 'WHOIS'
    };
    
    try {
      const response = await this.whoisQuery(whoisServer, domain);
      result.available = response.includes(availablePattern);
      console.log(`Domain ${domain} is ${result.available ? 'available' : 'not available'} via WHOIS`);
      
      // 保存一部分WHOIS响应用于调试
      const snippetLength = 100;
      const responseSnippet = response.length > snippetLength ? 
        response.substring(0, snippetLength) + '...' : response;
      console.log(`WHOIS response snippet for ${domain}: ${responseSnippet}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.error = `WHOIS error: ${errorMessage}`;
      console.error(`Error checking domain ${domain} via WHOIS:`, error);
    }
    
    return result;
  }
  
  /**
   * 将主机名解析为IP地址
   */
  private async hostnameToIp(hostname: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Resolving hostname: ${hostname}`);
      
      // 增加DNS超时处理
      const timeout = setTimeout(() => {
        reject(new Error(`DNS lookup timeout for ${hostname}`));
      }, 5000);
      
      // 使用优先IPv4的方式查询，避免IPv6连接问题
      dns.lookup(hostname, { family: 4, all: false }, (err, address, family) => {
        clearTimeout(timeout);
        if (err) {
          console.error(`DNS lookup error for ${hostname}:`, err);
          reject(new Error(`Failed to resolve ${hostname}: ${err.message} (code: ${err.code})`));
          return;
        }
        console.log(`Resolved ${hostname} to ${address} (IPv${family})`);
        resolve(address);
      });
    });
  }
  
  /**
   * 向WHOIS服务器发送查询请求（作为备用方法）
   */
  private async whoisQuery(server: string, query: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      let ip: string;
      try {
        // 检查服务器地址是否有效
        if (!server || server.trim() === '') {
          throw new Error(`Invalid WHOIS server address: "${server}"`);
        }
        
        // 确保不使用URL.canParse (Node.js 20+的API)
        try {
          ip = await this.hostnameToIp(server);
          console.log(`Resolved ${server} to ${ip}`);
        } catch (err) {
          console.error(`Failed to resolve hostname ${server}:`, err);
          reject(new Error(`Failed to resolve hostname: ${err instanceof Error ? err.message : 'unknown error'}`));
          return;
        }
      } catch (err) {
        reject(new Error(`Invalid server address: ${err instanceof Error ? err.message : 'unknown error'}`));
        return;
      }

      const socket = new net.Socket();
      let response = '';
      let connectTimeout: NodeJS.Timeout;
      let dataTimeout: NodeJS.Timeout;

      // 设置连接超时
      connectTimeout = setTimeout(() => {
        if (!socket.destroyed) {
          socket.destroy();
          reject(new Error(`Connection timeout after 5s for ${server}:43`));
        }
      }, 5000);

      // 记录连接开始时间，用于计算连接时间
      const connectStartTime = Date.now();
      
      socket.connect(43, ip, () => {
        const connectTime = Date.now() - connectStartTime;
        console.log(`Connected to ${server}:43 in ${connectTime}ms`);
        
        clearTimeout(connectTimeout);
        
        // 成功连接后，发送查询请求
        socket.write(`${query}\r\n`);
        console.log(`Query sent to ${server}: "${query}"`);
        
        // 设置数据接收超时
        dataTimeout = setTimeout(() => {
          if (!socket.destroyed) {
            socket.destroy();
            reject(new Error(`Data receive timeout after 5s for ${server}`));
          }
        }, 5000);
      });

      socket.on('data', (data: Buffer) => {
        // 收到数据，清除数据超时计时器并重新设置
        if (dataTimeout) clearTimeout(dataTimeout);
        
        const chunk = data.toString();
        response += chunk;
        console.log(`Received ${chunk.length} bytes from ${server}`);
        
        // 重新设置数据接收超时
        dataTimeout = setTimeout(() => {
          socket.end(); // 认为已经接收完毕，正常关闭连接
        }, 1000);
      });

      socket.on('close', () => {
        if (dataTimeout) clearTimeout(dataTimeout);
        console.log(`Connection to ${server} closed, received total ${response.length} bytes`);
        resolve(response);
      });

      socket.on('error', (err: Error) => {
        console.error(`Socket error for ${server}:`, err);
        if (connectTimeout) clearTimeout(connectTimeout);
        if (dataTimeout) clearTimeout(dataTimeout);
        reject(new Error(`Failed to connect to WHOIS server: ${err.message} (code: ${(err as any).code || 'unknown'})`));
      });
    });
  }
}

// 创建单例实例
export const domainCheckService = new DomainCheckService(); 