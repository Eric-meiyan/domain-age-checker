'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import TldSelector from '@/components/ui/TldSelector';
import { splitKeywords } from '@/lib/keywordUtils';

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
      const newKeywords = splitKeywords(keywordInput);
      
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
    <div className="w-full max-w-4xl mx-auto space-y-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm ring-1 ring-slate-900/5">
      {/* Mode Selection */}
      <div className="flex items-center justify-left">
        <RadioGroup 
          defaultValue={isAiMode ? "ai" : "normal"} 
          className="flex space-x-6 p-1 bg-white rounded-xl border border-slate-200 shadow-sm"
          onValueChange={(value) => setIsAiMode(value === "ai")}
        >
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="normal" id="normal-mode" className="border-2 border-slate-300" />
            <Label htmlFor="normal-mode" className="text-sm font-medium text-slate-700 cursor-pointer">
              {translations.normalMode}
            </Label>
          </div>
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <RadioGroupItem value="ai" id="ai-mode" className="border-2 border-blue-300" />
            <Label htmlFor="ai-mode" className="text-sm font-medium text-blue-700 cursor-pointer">
              ✨ {translations.aiMode}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="text-center">
          <label className="text-lg font-semibold text-slate-800 block mb-2">
            {isAiMode 
              ? `🤖 ${translations.inputAiDescription}` 
              : `📝 ${translations.inputKeywordsDescription}`
            }
          </label>
          
        </div>
        
        <div className="relative">
          <Textarea
            placeholder={isAiMode 
              ? translations.aiPlaceholder 
              : translations.keywordsPlaceholder
            }
            value={keywordInput}
            onChange={handleKeywordChange}
            className="w-full min-h-[120px] p-4 text-base border-2 border-slate-200 rounded-xl   transition-all duration-200 resize-none shadow-sm"
            rows={5}
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-400">
            {keywordInput.length}/500
          </div>
        </div>
      </div>

      {/* Generate/Update Button */}
      <div className="flex justify-center">
        <Button
          variant={isAiMode ? "default" : "outline"}
          onClick={handleUpdateKeywords}
          disabled={isGenerating || !keywordInput.trim()}
          className={`px-8 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
            isAiMode 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
              : 'border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {isGenerating && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          )}
          {isGenerating 
            ? translations.generating 
            : isAiMode 
              ? `✨ ${translations.generateKeywords}` 
              : translations.updateKeywords
          }
        </Button>
      </div>

      {/* Generated Keywords Display */}
      {keywords.length > 0 && (
        <div className="space-y-4 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <label className="text-base font-semibold text-slate-800">{translations.currentKeywords}</label>
            <span className="text-sm text-slate-500">({keywords.length} keywords)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 rounded-lg hover:from-blue-200 hover:to-purple-200 transition-colors"
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* TLD Selection */}
      <div className="space-y-4">
        <div className="text-center">
          <label className="text-lg font-semibold text-slate-800 block mb-2">
            🌐 {translations.selectTlds}
          </label>
          
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <TldSelector 
            selectedTlds={selectedTlds}
            onChange={handleTldSelectionChange}
            maxPopular={12}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Search Button */}
      <div className="flex justify-center pt-4">
        <Button
          className="px-12 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:shadow-md"
          size="lg"
          onClick={handleSubmit}
          disabled={loading || keywords.length === 0 || selectedTlds.length === 0}
        >
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
          )}
          {loading ? translations.checking : `🔍 ${translations.checkAvailability}`}
        </Button>
      </div>
    </div>
  );
} 