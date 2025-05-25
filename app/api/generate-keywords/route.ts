import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Polyfill for URL.canParse (Node.js v20+ feature) for compatibility with Node.js v19
if (!URL.canParse) {
  URL.canParse = function(url: string, base?: string): boolean {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少有效的提示词' },
        { status: 400 }
      );
    }

    // 构建系统提示和用户提示
    const systemPrompt = `你是一个专业的域名关键词生成器。
请根据用户的描述，生成10个适合用作域名的关键词。
这些关键词应该：
- 简短且有记忆点
- 仅包含字母、数字和连字符
- 与用户描述的业务或项目相关
- 适合用作域名前缀
- 不含任何特殊字符

请只返回关键词本身，用JSON数组格式，不要有任何其他解释或描述。`;

    // 调用OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `根据以下描述生成域名关键词: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    // 解析返回的内容
    const content = response.choices[0]?.message?.content || '{"keywords":[]}';
    let keywords: string[] = [];

    try {
      const parsedContent = JSON.parse(content);
      keywords = Array.isArray(parsedContent.keywords) ? parsedContent.keywords : [];
      
      // 验证和清理关键词
      keywords = keywords
        .filter(keyword => typeof keyword === 'string')
        .map(keyword => keyword.toLowerCase())
        .filter(keyword => /^[a-z0-9-]+$/.test(keyword))
        .slice(0, 10); // 确保最多返回6个关键词
    } catch (error) {
      console.error('解析OpenAI响应失败:', error);
    }

    return NextResponse.json({ success: true, keywords });
  } catch (error) {
    console.error('生成关键词时出错:', error);
    return NextResponse.json(
      { success: false, error: '生成关键词失败，请稍后重试' },
      { status: 500 }
    );
  }
} 