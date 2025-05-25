/**
 * Polyfills for Node.js compatibility
 * 为了兼容不同版本的Node.js而添加的polyfill
 */

// Polyfill for URL.canParse (Node.js v20+ feature)
// 为Node.js v19及以下版本添加URL.canParse支持
if (typeof URL !== 'undefined' && !URL.canParse) {
  (URL as any).canParse = function(url: string, base?: string): boolean {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

// 导出一个初始化函数，可以在需要的地方调用
export function initializePolyfills() {
  // 这个函数确保polyfills被加载
  // 目前只需要导入这个模块就足够了
}

// 类型声明扩展，为TypeScript添加URL.canParse的类型支持
declare global {
  interface URLConstructor {
    canParse(url: string, base?: string): boolean;
  }
}

export {}; 