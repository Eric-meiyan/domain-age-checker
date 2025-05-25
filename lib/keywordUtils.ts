/**
 * 关键词处理工具函数
 * 支持多种分隔符：英文逗号、中文逗号、空格、中文分号、英文分号
 */

/**
 * 将输入字符串按多种分隔符分割为关键词数组
 * @param input 输入字符串
 * @returns 清理后的关键词数组
 */
export function splitKeywords(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  // 支持的分隔符：英文逗号、中文逗号、空格、中文分号、英文分号
  // 使用正则表达式匹配一个或多个分隔符
  const separators = /[,，\s;；]+/;
  
  return input
    .split(separators)
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
}

/**
 * 验证关键词是否有效（用于域名）
 * @param keyword 关键词
 * @returns 是否有效
 */
export function isValidKeyword(keyword: string): boolean {
  if (!keyword || typeof keyword !== 'string') {
    return false;
  }
  
  // 基本长度检查
  const trimmed = keyword.trim();
  if (trimmed.length === 0 || trimmed.length > 63) {
    return false;
  }
  
  // 检查是否包含有效字符（字母、数字、连字符）
  // 注意：这里允许一些特殊字符，后续会在标准化时处理
  return /^[a-zA-Z0-9\u4e00-\u9fa5\-_\s]+$/.test(trimmed);
}

/**
 * 标准化关键词为有效的域名部分
 * @param keyword 原始关键词
 * @returns 标准化后的关键词
 */
export function normalizeKeyword(keyword: string): string {
  if (!keyword || typeof keyword !== 'string') {
    return '';
  }

  return keyword.trim().toLowerCase()
    .replace(/\s+/g, '') // 移除所有空格
    .replace(/[^a-z0-9-]/g, '-') // 将非字母数字字符替换为连字符
    .replace(/-{2,}/g, '-') // 将多个连续连字符替换为单个
    .replace(/^-|-$/g, ''); // 移除开头和结尾的连字符
}

/**
 * 处理和验证关键词列表
 * @param input 输入字符串或字符串数组
 * @returns 处理后的有效关键词数组
 */
export function processKeywords(input: string | string[]): string[] {
  let keywords: string[] = [];
  
  if (typeof input === 'string') {
    keywords = splitKeywords(input);
  } else if (Array.isArray(input)) {
    // 如果输入是数组，对每个元素进行分割处理
    keywords = input.flatMap(item => 
      typeof item === 'string' ? splitKeywords(item) : []
    );
  }
  
  // 过滤和标准化关键词
  const processedKeywords = keywords
    .filter(isValidKeyword)
    .map(normalizeKeyword)
    .filter(keyword => keyword.length > 0);
  
  // 去重
  return [...new Set(processedKeywords)];
} 