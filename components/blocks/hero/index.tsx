'use client';

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import Icon from "@/components/icon";
import Link from "next/link";
import { DomainCheckResult, DomainCheckResponse } from '@/types/domain';
import DomainSearch from './DomainSearch';
import DomainResults from './DomainResults';
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('DomainSearch');
  const [results, setResults] = useState<DomainCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DomainCheckResponse['stats'] | null>(null);
  const [queryMethod, setQueryMethod] = useState<'RDAP' | 'WHOIS' | null>(null);

  const handleSearch = async (keywords: string[], tlds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      setResults([]);
      setStats(null);
      setQueryMethod(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('/api/domain-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords,
          tlds,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          throw new Error('Connection error. Please try with fewer TLDs or domains.');
        }
      }

      const data = await response.json() as DomainCheckResponse;
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        setQueryMethod(data.method || 'RDAP');
        
        // 设置统计信息
        if (data.stats) {
          setStats(data.stats);
        } else {
          // 如果API未提供统计信息，自行计算
          const available = data.results.filter(r => r.available).length;
          const errors = data.results.filter(r => Boolean(r.error)).length;
          const unavailable = data.results.length - available - errors;
          
          setStats({
            total: data.results.length,
            available,
            unavailable,
            errors
          });
        }
        
        if (data.limitApplied) {
          let limitMessage = '';
          if (data.totalRequestedKeywords > data.totalProcessedKeywords) {
            limitMessage += `Only the first ${data.totalProcessedKeywords} of ${data.totalRequestedKeywords} keywords were processed. `;
          }
          if (data.totalRequestedTlds > data.totalProcessedTlds) {
            limitMessage += `Only the first ${data.totalProcessedTlds} of ${data.totalRequestedTlds} TLDs were processed. `;
          }
          limitMessage += 'This limitation helps prevent server overload.';
          setError(limitMessage);
        }

        // 检查错误率
        if (data.stats?.errors && data.stats.total) {
          const errorPercent = Math.round((data.stats.errors / data.stats.total) * 100);
          if (errorPercent > 30) {
            setError(`Note: ${data.stats.errors} out of ${data.stats.total} (${errorPercent}%) domain queries failed. This might be due to rate limits or connectivity issues with RDAP servers.`);
          }
        } else {
          const errorsCount = data.results.filter((result: DomainCheckResult) => result.error).length;
          if (errorsCount > 0) {
            const totalCount = data.results.length;
            const errorPercent = Math.round((errorsCount / totalCount) * 100);
            if (errorPercent > 30) {
              setError(`Note: ${errorsCount} out of ${totalCount} (${errorPercent}%) domain queries failed. This might be due to rate limits or connectivity issues with RDAP servers.`);
            }
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Domain check error:', err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please try with fewer TLDs or keywords.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during domain check');
      }
      if (results.length > 0) {
        setError(prev => `${prev || ''} Some results are displayed below, but they may be incomplete.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    errorEmptyKeywords: t('errorEmptyKeywords'),
    errorInvalidKeywords: t('errorInvalidKeywords'),
    errorGenerationFailed: t('errorGenerationFailed'),
    errorInvalidResponseFormat: t('errorInvalidResponseFormat'),
    errorNoKeywordsGenerated: t('errorNoKeywordsGenerated'),
    errorGenerationRetry: t('errorGenerationRetry'),
    errorNoKeywords: t('errorNoKeywords'),
    errorNoTlds: t('errorNoTlds'),
    normalMode: t('normalMode'),
    aiMode: t('aiMode'),
    inputAiDescription: t('inputAiDescription'),
    inputKeywordsDescription: t('inputKeywordsDescription'),
    aiPlaceholder: t('aiPlaceholder'),
    keywordsPlaceholder: t('keywordsPlaceholder'),
    generating: t('generating'),
    generateKeywords: t('generateKeywords'),
    updateKeywords: t('updateKeywords'),
    currentKeywords: t('currentKeywords'),
    selectTlds: t('selectTlds'),
    checking: t('checking'),
    checkAvailability: t('checkAvailability')
  };

  return (
    <>
      <HeroBg />
      <section className="py-8">
        <div className="container">
          <div className="text-center">
            <h1 className="mx-auto mb-3 mt-0 max-w-4xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl">
              Domain Availability Checker
            </h1>
        

            <div className="mt-12">
              <DomainSearch onSearch={handleSearch} loading={loading} translations={translations} />
              {stats && results.length > 0 && (
                <div className="w-full max-w-3xl mx-auto mt-4 bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-center gap-5 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-green-600">{stats.available}</span>
                      <span>Available</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-red-600">{stats.unavailable}</span>
                      <span>Taken</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-amber-600">{stats.errors}</span>
                      <span>Errors</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{stats.total}</span>
                      <span>Total</span>
                    </div>
                    {queryMethod && (
                      <div className="flex flex-col items-center">
                        <Badge variant="outline" className="font-mono">
                          {queryMethod}
                        </Badge>
                        <span>Protocol</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <DomainResults 
                results={results}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
