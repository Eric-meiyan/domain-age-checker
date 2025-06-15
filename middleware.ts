import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // 如果是API路由，直接跳过国际化处理
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 为 generate-keywords API 添加会话ID支持
    if (request.nextUrl.pathname === '/api/generate-keywords') {
      const sessionId = request.headers.get('x-session-id');
      if (sessionId) {
        const response = NextResponse.next();
        response.headers.set('x-session-id', sessionId);
        return response;
      }
    }
    return NextResponse.next();
  }
  
  // 处理国际化
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)",
    "/api/:path*", // 包含所有API路由
  ],
};
