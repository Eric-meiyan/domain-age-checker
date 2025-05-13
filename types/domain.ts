export interface DomainCheckResult {
  domain: string;
  available: boolean;
  tld: string;
  timestamp: number;
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