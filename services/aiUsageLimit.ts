import { auth } from "@/auth";
import { getClientIp } from "@/lib/ip";
import { 
  insertAiUsageRecord, 
  getUserDailyUsage, 
  getGuestDailyUsage,
  ServiceType,
  AiUsageRecord 
} from "@/models/aiUsage";
import { headers } from "next/headers";

export interface UsageLimitConfig {
  guestLimit: number;    // 未登录用户限制
  userLimit: number;     // 登录用户限制
}

export const KEYWORD_GENERATION_LIMITS: UsageLimitConfig = {
  guestLimit: 5,
  userLimit: 50
};

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  isGuest: boolean;
  message?: string;
}

export async function checkUsageLimit(
  serviceType: ServiceType,
  config: UsageLimitConfig
): Promise<UsageCheckResult> {
  const session = await auth();
  const clientIp = await getClientIp();
  const headersList = await headers();
  const sessionId = headersList.get("x-session-id") || "";

  if (session?.user?.uuid) {
    // 登录用户检查
    const currentUsage = await getUserDailyUsage(session.user.uuid, serviceType);
    const allowed = currentUsage < config.userLimit;
    
    return {
      allowed,
      currentUsage,
      limit: config.userLimit,
      isGuest: false,
      message: allowed 
        ? `今日还可使用 ${config.userLimit - currentUsage} 次`
        : `今日使用次数已达上限 ${config.userLimit} 次`
    };
  } else {
    // 未登录用户检查
    const currentUsage = await getGuestDailyUsage(sessionId, clientIp, serviceType);
    const allowed = currentUsage < config.guestLimit;
    
    return {
      allowed,
      currentUsage,
      limit: config.guestLimit,
      isGuest: true,
      message: allowed 
        ? `未登录用户今日还可使用 ${config.guestLimit - currentUsage} 次，登录后可使用 ${config.userLimit} 次`
        : `未登录用户今日使用次数已达上限 ${config.guestLimit} 次，请登录获取更多使用次数`
    };
  }
}

export async function recordUsage(serviceType: ServiceType): Promise<void> {
  const session = await auth();
  const clientIp = await getClientIp();
  const headersList = await headers();
  const sessionId = headersList.get("x-session-id") || "";
  const userAgent = headersList.get("user-agent") || "";

  const record: AiUsageRecord = {
    user_uuid: session?.user?.uuid,
    session_id: sessionId,
    ip_address: clientIp,
    service_type: serviceType,
    user_agent: userAgent
  };

  await insertAiUsageRecord(record);
} 