'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calendar, Clock, Globe, Loader2 } from 'lucide-react';
import { DomainCheckResult } from '@/types/domain';

interface DomainAgeResult extends DomainCheckResult {
  registrationDate?: string;
  expirationDate?: string;
  lastChangedDate?: string;
  domainAge?: number;
}

export default function DomainAgeCheckerPage() {
  const t = useTranslations('domain_age_checker');
  const locale = useLocale();
  const [domains, setDomains] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainAgeResult[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const domainList = domains
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0)
        .slice(0, 10);

      if (domainList.length === 0) {
        setError(t('error_min_domains'));
        setLoading(false);
        return;
      }

      // 直接传递完整域名数组
      const response = await fetch('/api/domain-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domains: domainList,
        }),
      });

      if (!response.ok) {
        throw new Error(`${t('error_api_failed')}: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || t('error_query_failed'));
      }

      const registeredDomains = data.results.filter((result: DomainAgeResult) => 
        !result.available && !result.error
      );

      setResults(registeredDomains);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDomainAge = (days?: number) => {
    if (!days || days < 0) return 'N/A';
    
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const months = Math.floor(remainingDays / 30);
    const finalDays = remainingDays % 30;

    const parts = [];
    if (locale === 'zh') {
      if (years > 0) parts.push(`${years}年`);
      if (months > 0) parts.push(`${months}月`);
      if (finalDays > 0) parts.push(`${finalDays}天`);
      return parts.length > 0 ? parts.join(' ') : '不到1天';
    } else {
      if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
      if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
      if (finalDays > 0) parts.push(`${finalDays} day${finalDays === 1 ? '' : 's'}`);
      return parts.length > 0 ? parts.join(' ') : 'Less than 1 day';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <h2 className="text-xl text-gray-600 mb-8">
            {t('description')}
          </h2>
          <div className="flex justify-center space-x-8 text-sm text-gray-500 mb-8">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {t('registration_date')}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Domain Age
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              {t('expiration_date')}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('input_title')}</CardTitle>
            <CardDescription>
              {t('input_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder={t('input_placeholder')}
                rows={6}
                className="resize-none"
                disabled={loading}
              />
              <Button 
                type="submit" 
                disabled={loading || !domains.trim()}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t('button_searching') : t('button_search')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('results_title')}</CardTitle>
              <CardDescription>
                {t('results_description', { count: results.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.domain}
                      </h3>
                      <div className="flex space-x-2">
                        <Badge variant="secondary">
                          {result.method || 'RDAP'}
                        </Badge>
                        {result.domainAge && (
                          <Badge variant="outline">
                            {formatDomainAge(result.domainAge)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium text-gray-900">{t('registration_date')}</div>
                          <div className="text-gray-600">
                            {formatDate(result.registrationDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{t('expiration_date')}</div>
                          <div className="text-gray-600">
                            {formatDate(result.expirationDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium text-gray-900">{t('last_changed')}</div>
                          <div className="text-gray-600">
                            {formatDate(result.lastChangedDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < results.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('about_title')}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              {t('about_description')}
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('features_title')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
              {t.raw('features').map((feature: string, index: number) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('usage_title')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
              {t.raw('usage').map((instruction: string, index: number) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('why_important_title')}</h3>
            <p className="text-gray-600">
              {t('why_important_description')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}