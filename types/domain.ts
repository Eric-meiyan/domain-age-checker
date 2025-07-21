export interface DomainCheckResult {
  domain: string;
  available: boolean;
  tld: string;
  timestamp: number;
  error?: string;
  rdapData?: any; // RDAP查询返回的完整数据
  method?: 'RDAP' | 'WHOIS'; // 表示使用的查询方法
  registrationDate?: string; // 注册时间
  expirationDate?: string; // 到期时间
  lastChangedDate?: string; // 最后修改时间
  domainAge?: number; // 域名年龄(天数)
}

export interface DomainCheckResponse {
  success: boolean;
  method: 'RDAP' | 'WHOIS';
  results: DomainCheckResult[];
  stats?: {
    total: number;
    available: number;
    unavailable: number;
    errors: number;
  };
  limitApplied: boolean;
  totalRequestedKeywords: number;
  totalProcessedKeywords: number;
  totalRequestedTlds: number;
  totalProcessedTlds: number;
  timestamp: string;
  error?: string;
}

export interface TldConfig {
  name: string;
  server: string;
  availablePattern: string;
  enabled: boolean;
  displayName: string;
}

export {}; 