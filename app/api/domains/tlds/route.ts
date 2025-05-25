import { NextResponse } from 'next/server';
import { domainCheckService } from '@/services/DomainCheckService';
import { TldConfig } from '@/models/TldModel';

/**
 * RDAP引导文件接口定义
 * IANA提供的注册数据访问协议(RDAP)引导JSON结构
 * 用于获取各个顶级域名(TLD)对应的RDAP服务器信息
 */
interface RdapBootstrap {
  /** RDAP引导文件版本号 */
  version: string;
  /** 发布时间，ISO格式的日期字符串 */
  publication: string;
  /** 引导文件的描述信息 */
  description: string;
  /**
   * 服务配置数组，每个条目包含两个子数组：
   * - 第一个子数组：域名模式列表，如 ["com", "net", "*.example"]
   * - 第二个子数组：对应的RDAP服务器URL列表
   * 例如: [["com", "net"], ["https://rdap.example.com/", "https://rdap-alt.example.com/"]]
   */
  services: Array<[string[], string[]]>;
}

// 跟踪服务初始化状态
let serviceInitialized = false;

/**
 * 初始化域名检查服务
 */
async function initializeService() {
  if (!serviceInitialized) {
    console.log('Initializing Domain Check Service for TLDs API...');
    await domainCheckService.initialize();
    serviceInitialized = true;
    console.log('Domain Check Service initialized for TLDs API');
  }
}

/**
 * API路由处理程序 - 获取所有TLD信息
 * @route GET /api/domains/tlds
 */
export async function GET() {
  try {
    // 先尝试从DomainCheckService获取缓存数据
    console.log('Fetching TLDs from DomainCheckService cache...');
    
    // 确保服务已初始化（这会加载缓存）
    await initializeService();
    
    // 获取所有TLD配置
    const tldConfigs = domainCheckService.getEnabledTlds();
    
    // 从rdapServerMap中提取数据
    const tlds = tldConfigs.map((tld: TldConfig) => {
      // 尝试从服务器名称中提取可能的RDAP服务器
      // 注意：这是基于DomainCheckService的实现，可能需要调整
      let rdapServers: string[] = [];
      if (tld.server && tld.server.includes('://')) {
        rdapServers = [tld.server];
      }
      
      return {
        name: tld.name,
        rdapServers: rdapServers,
        displayName: tld.displayName
      };
    });
    
    console.log(`Returning ${tlds.length} TLDs from cached data`);
    
    // 返回结果
    return NextResponse.json({
      success: true,
      count: tlds.length,
      data: tlds,
      timestamp: new Date().toISOString(),
      source: 'DomainCheckService Cache'
    });
    
  } catch (serviceError) {
    console.error('Error getting TLDs from DomainCheckService:', serviceError);
    console.log('Falling back to direct IANA API call...');
    
    // 如果从服务获取失败，回退到直接从IANA获取
    try {
      // 获取IANA RDAP引导文件
      const response = await fetch('https://data.iana.org/rdap/dns.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RDAP data: ${response.status} ${response.statusText}`);
      }
      
      const bootstrapData: RdapBootstrap = await response.json();
      
      // 提取所有TLD
      const tlds: { name: string; rdapServers: string[] }[] = [];
      
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
              rdapServers
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
      
      console.log(`Returning ${uniqueTlds.length} TLDs from direct IANA API call`);
      
      // 返回结果
      return NextResponse.json({
        success: true,
        count: uniqueTlds.length,
        data: uniqueTlds,
        timestamp: new Date().toISOString(),
        source: 'IANA RDAP Bootstrap (Direct)'
      });
      
    } catch (ianaError) {
      console.error('Error fetching TLD information from IANA:', ianaError);
      
      return NextResponse.json(
        {
          success: false,
          error: ianaError instanceof Error ? ianaError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }
} 