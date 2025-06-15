import { getSupabaseClient } from "./db";
import { getIsoTimestr } from "@/lib/time";

export interface AiUsageRecord {
  id?: number;
  user_uuid?: string;
  session_id?: string;
  ip_address: string;
  service_type: string;
  created_at?: string;
  user_agent?: string;
}

export enum ServiceType {
  KeywordGeneration = "keyword_generation"
}

export async function insertAiUsageRecord(record: AiUsageRecord) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_usage_records")
    .insert({
      ...record,
      created_at: getIsoTimestr()
    });

  if (error) {
    throw error;
  }
  return data;
}

// 获取用户今日使用次数（登录用户）
export async function getUserDailyUsage(
  userUuid: string, 
  serviceType: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_usage_records")
    .select("id", { count: "exact" })
    .eq("user_uuid", userUuid)
    .eq("service_type", serviceType)
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  if (error) {
    console.error("Error getting user daily usage:", error);
    return 0;
  }

  return data?.length || 0;
}

// 获取未登录用户今日使用次数（基于会话ID和IP）
export async function getGuestDailyUsage(
  sessionId: string,
  ipAddress: string,
  serviceType: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const supabase = getSupabaseClient();
  
  // 优先使用 session_id，如果没有则使用 IP
  let query = supabase
    .from("ai_usage_records")
    .select("id", { count: "exact" })
    .eq("service_type", serviceType)
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString())
    .is("user_uuid", null);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else {
    query = query.eq("ip_address", ipAddress);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error getting guest daily usage:", error);
    return 0;
  }

  return data?.length || 0;
} 