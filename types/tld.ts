export interface Tld {
  name: string;
  server: string;
  availablePattern: string;
  enabled: boolean;
  displayName: string;
  isPopular?: boolean; // 新增字段，标记为常用
} 