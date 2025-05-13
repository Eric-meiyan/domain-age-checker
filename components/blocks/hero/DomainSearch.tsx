'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DomainSearchProps {
  onSearch: (keywords: string[], tlds: string[]) => Promise<void>;
  loading: boolean;
}

export default function DomainSearch({ onSearch, loading }: DomainSearchProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 预定义的TLD列表
  const availableTlds = [
    { name: 'com', displayName: '.com' },
    { name: 'net', displayName: '.net' },
    { name: 'org', displayName: '.org' },
    { name: 'io', displayName: '.io' },
    { name: 'co', displayName: '.co' },
    { name: 'app', displayName: '.app' },
  ];

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(e.target.value);
  };

  const handleTldToggle = (tld: string) => {
    setSelectedTlds(prev => 
      prev.includes(tld) 
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const handleSubmit = async () => {
    // 验证输入
    if (!keywordInput.trim()) {
      setError('Please enter at least one keyword');
      return;
    }

    if (selectedTlds.length === 0) {
      setError('Please select at least one TLD');
      return;
    }

    setError(null);
    const keywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
    await onSearch(keywords, selectedTlds);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* 关键词输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Enter keywords (comma separated)</label>
        <Input
          type="text"
          placeholder="example, test, mydomain"
          value={keywordInput}
          onChange={handleKeywordChange}
          className="w-full"
        />
      </div>

      {/* TLD 选择器 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select TLDs</label>
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

      {/* 错误提示 */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* 搜索按钮 */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Check Domain Availability'}
      </Button>
    </div>
  );
} 