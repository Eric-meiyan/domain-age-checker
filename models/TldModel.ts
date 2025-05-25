export interface Tld {
  name: string;
  rdapServers: string[];
  displayName?: string;
  whoisServer?: string;
  availablePattern?: string;
  enabled?: boolean;
}

export interface TldListResponse {
  success: boolean;
  count: number;
  data: Tld[];
  timestamp: string;
  source: string;
  error?: string;
}

export interface TldConfig {
  name: string;
  server: string;
  availablePattern: string;
  enabled: boolean;
  displayName: string;
}

export const formatTldForConfig = (tld: Tld): TldConfig => {
  return {
    name: tld.name,
    server: tld.whoisServer || tld.rdapServers[0] || '',
    availablePattern: tld.availablePattern || 'No match for',
    enabled: tld.enabled ?? true,
    displayName: tld.displayName || `.${tld.name}`
  };
};

interface RdapBootstrap {
  version: string;
  publication: string;
  description: string;
  services: Array<[string[], string[]]>;
}

export const fetchTlds = async (): Promise<TldListResponse> => {
  try {
    // 直接从IANA获取完整TLD数据
    const response = await fetch('https://data.iana.org/rdap/dns.json');
    
    if (!response.ok) {
      throw new Error(`Error fetching TLDs from IANA: ${response.status} ${response.statusText}`);
    }
    
    const bootstrapData: RdapBootstrap = await response.json();
    
    // 提取所有TLD
    const tlds: Tld[] = [];
    
    // 从services数组中提取TLD信息
    bootstrapData.services.forEach(service => {
      const tldPatterns = service[0];
      const rdapServers = service[1];
      
      tldPatterns.forEach(pattern => {
        // 移除通配符和前导点，获取纯TLD
        let tldName = pattern.replace(/^\*\./, '');
        
        // 如果是纯TLD (不包含通配符或其他特殊字符)
        if (!/[*]/.test(tldName)) {
          tlds.push({
            name: tldName,
            rdapServers,
            displayName: `.${tldName}`
          });
        }
      });
    });
    
    // 去重（有些TLD可能在多个服务中重复出现）
    const uniqueTlds = Array.from(
      new Map(tlds.map(item => [item.name, item])).values()
    );
    
    // 按字母顺序排序
    uniqueTlds.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      success: true,
      count: uniqueTlds.length,
      data: uniqueTlds,
      timestamp: new Date().toISOString(),
      source: 'IANA RDAP Bootstrap'
    };
  } catch (error) {
    console.error('Failed to fetch TLDs from IANA:', error);
    return {
      success: false,
      count: 0,
      data: [],
      timestamp: new Date().toISOString(),
      source: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 