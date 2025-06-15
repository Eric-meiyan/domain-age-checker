import { auth } from "@/auth";
import { getUserDailyUsage } from "@/models/aiUsage";
import { ServiceType } from "@/models/aiUsage";
import { KEYWORD_GENERATION_LIMITS } from "@/services/aiUsageLimit";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function AiUsagePage() {
  const session = await auth();
  const t = await getTranslations();
  
  if (!session?.user?.uuid) {
    redirect("/auth/signin");
  }

  const keywordUsage = await getUserDailyUsage(
    session.user.uuid, 
    ServiceType.KeywordGeneration
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 使用统计</h1>
        <p className="text-gray-600">查看您的 AI 服务使用情况</p>
      </div>
      
      <div className="grid gap-6">
        {/* 关键词生成统计 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🔤</span>
                关键词生成
              </h2>
              <p className="text-sm text-gray-500 mt-1">AI 智能生成域名关键词</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {keywordUsage}
              </div>
              <div className="text-sm text-gray-500">今日使用次数</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">使用进度</span>
              <span className="font-medium text-gray-900">
                {keywordUsage} / {KEYWORD_GENERATION_LIMITS.userLimit}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${Math.min((keywordUsage / KEYWORD_GENERATION_LIMITS.userLimit) * 100, 100)}%` 
                }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">剩余次数</span>
              <span className={`font-medium ${
                KEYWORD_GENERATION_LIMITS.userLimit - keywordUsage > 10 
                  ? 'text-green-600' 
                  : KEYWORD_GENERATION_LIMITS.userLimit - keywordUsage > 5
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {Math.max(KEYWORD_GENERATION_LIMITS.userLimit - keywordUsage, 0)} 次
              </span>
            </div>
          </div>
          
          {keywordUsage >= KEYWORD_GENERATION_LIMITS.userLimit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 text-sm">
                  ⚠️ 今日使用次数已达上限，明天将重置
                </span>
              </div>
            </div>
          )}
          
          {keywordUsage < KEYWORD_GENERATION_LIMITS.userLimit && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 text-sm">
                  💡 每日 00:00 重置使用次数
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 使用提示 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            使用提示
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>登录用户每日可使用 {KEYWORD_GENERATION_LIMITS.userLimit} 次 AI 关键词生成</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>未登录用户每日仅可使用 {KEYWORD_GENERATION_LIMITS.guestLimit} 次</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>使用次数每日 00:00 自动重置</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>AI 生成的关键词质量更高，更适合域名注册</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 