'use client';

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import Icon from "@/components/icon";
import Link from "next/link";
import { DomainCheckResult } from '@/types/domain';
import DomainSearch from './DomainSearch';
import DomainResults from './DomainResults';
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('DomainSearch');
  const [results, setResults] = useState<DomainCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (keywords: string[], tlds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      setResults([]);

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

      const data = await response.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        
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

        const errorsCount = data.results.filter((result: DomainCheckResult) => result.error).length;
        if (errorsCount > 0) {
          const totalCount = data.results.length;
          const errorPercent = Math.round((errorsCount / totalCount) * 100);
          if (errorPercent > 30) {
            setError(`Note: ${errorsCount} out of ${totalCount} (${errorPercent}%) domain queries failed. This might be due to rate limits or connectivity issues with WHOIS servers.`);
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
            <h1 className="mx-auto mb-3 mt-0 max-w-3xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl">
              Domain Availability Checker
            </h1>
        

            <div className="mt-12">
              <DomainSearch onSearch={handleSearch} loading={loading} translations={translations} />
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
