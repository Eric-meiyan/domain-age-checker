'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
// Button component is not used in the current version, can be removed if not planned for future use
// import { Button } from '@/components/ui/button'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Tld } from '@/types/tld';

interface TldSelectorProps {
  selectedTlds: string[];
  onChange: (selected: string[]) => void;
  maxPopular?: number;
}

// Popular TLDs that will be shown in the top section
const POPULAR_TLDS = ['com', 'net', 'org', 'io', 'app', 'dev', 'co', 'info', 'xyz', 'ai', 'tech', 'me', 'site'];

// Default TLDs to use as fallback when API fails
const DEFAULT_TLDS: Tld[] = [
  { name: 'com', displayName: '.com', server: '', availablePattern: '', enabled: true, isPopular: true },
  { name: 'net', displayName: '.net', server: '', availablePattern: '', enabled: true, isPopular: true },
  { name: 'org', displayName: '.org', server: '', availablePattern: '', enabled: true, isPopular: true },
  { name: 'io', displayName: '.io', server: '', availablePattern: '', enabled: true, isPopular: true },
  { name: 'app', displayName: '.app', server: '', availablePattern: '', enabled: true, isPopular: true }
];

const TldSelector: React.FC<TldSelectorProps> = ({
  selectedTlds,
  onChange,
  maxPopular = 15,
}) => {
  const t = useTranslations('TldSelector');
  const [allAvailableTlds, setAllAvailableTlds] = useState<Tld[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAllTldsExpanded, setIsAllTldsExpanded] = useState(false);

  // Fetch TLD data directly from IANA RDAP Bootstrap
  useEffect(() => {
    const fetchTlds = async () => {
      try {
        setLoading(true);
        
        // First try to fetch from our API endpoint that has caching
        let response = await fetch('/api/domains/tlds');
        
        if (!response.ok) {
          // If that fails, try to fetch directly from IANA
          response = await fetch('https://data.iana.org/rdap/dns.json');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch TLDs: ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        // Process the data depending on its source
        let formattedTlds: Tld[] = [];
        
        if (data.success && Array.isArray(data.data)) {
          // Format from our API
          formattedTlds = data.data.map((tld: any) => ({
            name: tld.name,
            displayName: `.${tld.name}`,
            server: tld.rdapServers && tld.rdapServers.length > 0 ? tld.rdapServers[0] : '',
            availablePattern: '',
            enabled: true,
            isPopular: POPULAR_TLDS.includes(tld.name)
          }));
        } else if (data.services && Array.isArray(data.services)) {
          // Direct format from IANA
          const tlds: { name: string; rdapServers: string[] }[] = [];
          
          data.services.forEach((service: [string[], string[]]) => {
            const tldPatterns = service[0];
            const rdapServers = service[1];
            
            tldPatterns.forEach(pattern => {
              // Remove wildcards and leading dots
              let tldName = pattern.replace(/^\*\./, '');
              
              // Only include pure TLDs
              if (!/[*]/.test(tldName)) {
                tlds.push({
                  name: tldName,
                  rdapServers
                });
              }
            });
          });
          
          // Deduplicate and sort
          const uniqueTlds = Array.from(
            new Map(tlds.map(item => [item.name, item])).values()
          ).sort((a, b) => a.name.localeCompare(b.name));
          
          formattedTlds = uniqueTlds.map(tld => ({
            name: tld.name,
            displayName: `.${tld.name}`,
            server: tld.rdapServers && tld.rdapServers.length > 0 ? tld.rdapServers[0] : '',
            availablePattern: '',
            enabled: true,
            isPopular: POPULAR_TLDS.includes(tld.name)
          }));
        } else {
          throw new Error('Invalid response format');
        }
        
        if (formattedTlds.length === 0) {
          throw new Error('No TLDs found in the response');
        }
        
        setAllAvailableTlds(formattedTlds);
      } catch (err) {
        console.error('Error fetching TLDs:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load TLDs';
        setError(errorMessage);
        toast.error(`${t('errorLoading') || 'Error loading TLDs'}: ${errorMessage}`);
        
        // Set default TLDs as fallback
        setAllAvailableTlds(DEFAULT_TLDS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTlds();
  }, [t]);

  const popularTlds = useMemo(() => {
    return allAvailableTlds
      .filter(tld => tld.isPopular)
      .slice(0, maxPopular);
  }, [allAvailableTlds, maxPopular]);

  const allSortedTlds = useMemo(() => {
    return [...allAvailableTlds].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [allAvailableTlds]);

  // Filtered TLDs for search results
  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return []; // No search term, no results from this memo
    }
    return allAvailableTlds.filter(tld =>
      tld.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tld.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.displayName.localeCompare(b.displayName)); // Sort search results as well
  }, [allAvailableTlds, searchTerm]);

  const handleTldToggle = (tldName: string) => {
    const newSelected = selectedTlds.includes(tldName)
      ? selectedTlds.filter(name => name !== tldName)
      : [...selectedTlds, tldName];
    onChange(newSelected);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-blue-200 animate-pulse"></div>
        </div>
        <span className="mt-4 text-base font-medium text-slate-700">{t('loading') || 'Loading TLDs...'}</span>
        <span className="mt-1 text-sm text-slate-500">Please wait while we fetch domain extensions</span>
      </div>
    );
  }

  if (error && allAvailableTlds.length === 0) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-700 font-medium text-base mb-2">{t('errorLoading') || 'Error loading TLDs'}</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Search Input */}
      <div className="relative">
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 shadow-sm"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          🔍
        </div>
      </div>

      {/* Warning Message */}
      {error && allAvailableTlds.length > 0 && (
        <div className="px-4 py-3 text-sm bg-amber-50 text-amber-700 rounded-xl border border-amber-200 flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span>{t('warningUsingFallback') || 'Using fallback TLD data due to connection issues'}</span>
        </div>
      )}

      {searchTerm === '' ? (
        <>
          {/* Popular TLDs Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-slate-800">{t('popularTlds')}</h3>
              <span className="text-sm text-slate-500">({popularTlds.length} options)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {popularTlds.map(tld => (
                <div key={`popular-${tld.name}`} className="group">
                  <div className={`flex items-center space-x-3 p-3 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    selectedTlds.includes(tld.name) 
                      ? 'border-blue-400 bg-blue-50 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <Checkbox
                      id={`popular-tld-${tld.name}`}
                      checked={selectedTlds.includes(tld.name)}
                      onCheckedChange={() => handleTldToggle(tld.name)}
                      className="shrink-0"
                    />
                    <label
                      htmlFor={`popular-tld-${tld.name}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-grow truncate"
                      title={tld.displayName}
                    >
                      {tld.displayName}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible All TLDs Section */}
          <Accordion 
            type="single" 
            collapsible 
            className="w-full" 
            value={isAllTldsExpanded ? "all-tlds-item" : ""} 
            onValueChange={(value) => setIsAllTldsExpanded(value === "all-tlds-item")}
          >
            <AccordionItem value="all-tlds-item" className="border border-slate-200 rounded-xl overflow-hidden">
              <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <span>{isAllTldsExpanded ? t('hideAllButton') : t('showAllButton', { count: allAvailableTlds.length })}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-white">
                <ScrollArea className="h-[300px] w-full pr-3">
                  <div className="space-y-2">
                    {allSortedTlds.map(tld => (
                      <div key={`all-sorted-${tld.name}`} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        selectedTlds.includes(tld.name) 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}>
                        <Checkbox
                          id={`all-sorted-tld-${tld.name}`}
                          checked={selectedTlds.includes(tld.name)}
                          onCheckedChange={() => handleTldToggle(tld.name)}
                          className="shrink-0"
                        />
                        <label
                          htmlFor={`all-sorted-tld-${tld.name}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-grow truncate"
                          title={tld.displayName}
                        >
                          {tld.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      ) : (
        // Search Results Section
        <div className='space-y-4'>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="text-base font-semibold text-slate-800">
              {t('searchResults', { count: searchResults.length })}
            </h3>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-500 font-medium">{t('noTldsFound')}</p>
            </div>
          ) : (
            <ScrollArea className="h-[380px] w-full pr-3">
              <div className="space-y-2">
                {searchResults.map(tld => (
                  <div key={`search-${tld.name}`} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedTlds.includes(tld.name) 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}>
                    <Checkbox
                      id={`search-tld-${tld.name}`}
                      checked={selectedTlds.includes(tld.name)}
                      onCheckedChange={() => handleTldToggle(tld.name)}
                      className="shrink-0"
                    />
                    <label
                      htmlFor={`search-tld-${tld.name}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-grow truncate"
                      title={tld.displayName}
                    >
                      {tld.displayName}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default TldSelector; 