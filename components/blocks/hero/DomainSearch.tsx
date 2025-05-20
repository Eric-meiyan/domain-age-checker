'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import TldSelector from '@/components/ui/TldSelector';

interface DomainSearchProps {
  onSearch: (keywords: string[], tlds: string[]) => Promise<void>;
  loading: boolean;
  translations: {
    errorEmptyKeywords: string;
    errorInvalidKeywords: string;
    errorGenerationFailed: string;
    errorInvalidResponseFormat: string;
    errorNoKeywordsGenerated: string;
    errorGenerationRetry: string;
    errorNoKeywords: string;
    errorNoTlds: string;
    normalMode: string;
    aiMode: string;
    inputAiDescription: string;
    inputKeywordsDescription: string;
    aiPlaceholder: string;
    keywordsPlaceholder: string;
    generating: string;
    generateKeywords: string;
    updateKeywords: string;
    currentKeywords: string;
    selectTlds: string;
    checking: string;
    checkAvailability: string;
  };
}

export default function DomainSearch({ onSearch, loading, translations }: DomainSearchProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedTlds, setSelectedTlds] = useState<string[]>(['com']);
  const [error, setError] = useState<string | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywordInput(e.target.value);
  };

  const handleTldSelectionChange = (newSelectedTlds: string[]) => {
    setSelectedTlds(newSelectedTlds);
  };

  const handleUpdateKeywords = () => {
    if (!keywordInput.trim()) {
      setError(translations.errorEmptyKeywords);
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
        setError(translations.errorInvalidKeywords);
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
        throw new Error(data.error || translations.errorGenerationFailed);
      }
      
      if (!data.success || !Array.isArray(data.keywords)) {
        throw new Error(translations.errorInvalidResponseFormat);
      }
      
      if (data.keywords.length === 0) {
        setError(translations.errorNoKeywordsGenerated);
        return;
      }
      
      setKeywords(data.keywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : translations.errorGenerationRetry);
      console.error('AI keyword generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (keywords.length === 0) {
      setError(translations.errorNoKeywords);
      return;
    }

    if (selectedTlds.length === 0) {
      setError(translations.errorNoTlds);
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
            <Label htmlFor="normal-mode">{translations.normalMode}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ai" id="ai-mode" />
            <Label htmlFor="ai-mode">{translations.aiMode}</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {isAiMode 
            ? translations.inputAiDescription 
            : translations.inputKeywordsDescription
          }
        </label>
        <Textarea
          placeholder={isAiMode 
            ? translations.aiPlaceholder 
            : translations.keywordsPlaceholder
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
          ? translations.generating 
          : isAiMode 
            ? translations.generateKeywords 
            : translations.updateKeywords
        }
      </Button>

      {keywords.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{translations.currentKeywords}</label>
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
        <label className="text-sm font-medium">{translations.selectTlds}</label>
        <TldSelector 
          selectedTlds={selectedTlds}
          onChange={handleTldSelectionChange}
          maxPopular={12}
        />
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
        {loading ? translations.checking : translations.checkAvailability}
      </Button>
    </div>
  );
} 