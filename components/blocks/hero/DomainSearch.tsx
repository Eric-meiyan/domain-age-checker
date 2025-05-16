'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DomainSearchProps {
  onSearch: (keywords: string[], tlds: string[]) => Promise<void>;
  loading: boolean;
}

export default function DomainSearch({ onSearch, loading }: DomainSearchProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 预定义的TLD列表
  const availableTlds = [
    { name: 'com', displayName: '.com' },
    { name: 'net', displayName: '.net' },
    { name: 'org', displayName: '.org' },
    { name: 'io', displayName: '.io' },
    { name: 'co', displayName: '.co' },
    { name: 'app', displayName: '.app' },
  ];

  const handleKeywordChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywordInput(e.target.value);
  };

  const handleTldToggle = (tld: string) => {
    setSelectedTlds(prev => 
      prev.includes(tld) 
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const handleUpdateKeywords = () => {
    if (!keywordInput.trim()) {
      setError('请输入至少一个关键词');
      return;
    }

    if (isAiMode) {
      generateKeywordsFromAI(keywordInput);
    } else {
      const newKeywords = keywordInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k);
      
      if (newKeywords.length === 0) {
        setError('请输入有效的关键词');
        return;
      }
      
      setKeywords(newKeywords);
      setError(null);
    }
  };

  const generateKeywordsFromAI = async (prompt: string) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // 调用我们自己的API
      const response = await fetch('/api/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '生成关键词失败');
      }
      
      if (!data.success || !Array.isArray(data.keywords)) {
        throw new Error('返回数据格式不正确');
      }
      
      if (data.keywords.length === 0) {
        setError('无法生成关键词，请尝试更具体的关键词描述');
        return;
      }
      
      setKeywords(data.keywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成关键词失败，请重试');
      console.error('AI keyword generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (keywords.length === 0) {
      setError('请先生成或输入关键词');
      return;
    }

    if (selectedTlds.length === 0) {
      setError('请选择至少一个TLD');
      return;
    }

    setError(null);
    await onSearch(keywords, selectedTlds);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <RadioGroup 
          defaultValue={isAiMode ? "ai" : "normal"} 
          className="flex space-x-4"
          onValueChange={(value) => setIsAiMode(value === "ai")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="normal-mode" />
            <Label htmlFor="normal-mode">普通模式</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ai" id="ai-mode" />
            <Label htmlFor="ai-mode">AI模式</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {isAiMode 
            ? "输入项目描述，AI将生成域名关键词" 
            : "输入关键词（逗号分隔）"
          }
        </label>
        <Textarea
          placeholder={isAiMode 
            ? "例如：我想创建一个销售手工蛋糕和甜点的在线商店..." 
            : "example, test, mydomain"
          }
          value={keywordInput}
          onChange={handleKeywordChange}
          className="w-full"
          rows={5}
        />
      </div>

      <Button
        variant="outline"
        onClick={handleUpdateKeywords}
        disabled={isGenerating || !keywordInput.trim()}
        className="w-full"
      >
        {isGenerating 
          ? '生成中...' 
          : isAiMode 
            ? '生成关键词' 
            : '更新关键词'
        }
      </Button>

      {keywords.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">当前关键词：</label>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">选择域名后缀</label>
        <div className="flex flex-wrap gap-2">
          {availableTlds.map(tld => (
            <Badge
              key={tld.name}
              variant={selectedTlds.includes(tld.name) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTldToggle(tld.name)}
            >
              {tld.displayName}
            </Badge>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={loading || keywords.length === 0 || selectedTlds.length === 0}
      >
        {loading ? '检查中...' : '检查域名可用性'}
      </Button>
    </div>
  );
} 