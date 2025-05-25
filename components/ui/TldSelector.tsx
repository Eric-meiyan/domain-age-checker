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

  const renderTldList = (tldsToList: Tld[], listContext: string = 'all') => {
    if (tldsToList.length === 0 && searchTerm) {
      return <p className="text-sm text-muted-foreground p-4 text-center">{t('noTldsFound')}</p>;
    }
    return tldsToList.map(tld => (
      <div key={`${listContext}-${tld.name}`} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
        <Checkbox
          id={`${listContext}-tld-${tld.name}`}
          checked={selectedTlds.includes(tld.name)}
          onCheckedChange={() => handleTldToggle(tld.name)}
          className="shrink-0" // Added for consistent sizing
        />
        <label
          htmlFor={`${listContext}-tld-${tld.name}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer truncate"
          title={tld.displayName} // Added for better UX on truncated names
        >
          {tld.displayName}
        </label>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg w-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">{t('loading') || 'Loading TLDs...'}</span>
      </div>
    );
  }

  if (error && allAvailableTlds.length === 0) {
    return (
      <div className="p-4 border rounded-lg w-full text-red-500">
        <p>{t('errorLoading') || 'Error loading TLDs'}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 border rounded-lg w-full">
      <Input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />

      {error && allAvailableTlds.length > 0 && (
        <div className="px-3 py-2 text-xs bg-yellow-50 text-yellow-700 rounded-md mb-2">
          {t('warningUsingFallback') || 'Using fallback TLD data due to connection issues'}
        </div>
      )}

      {searchTerm === '' ? (
        <>
          {/* Popular TLDs Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('popularTlds')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {popularTlds.map(tld => (
                // Using a slightly different rendering for popular TLDs for potentially different styling/layout if needed
                <div key={`popular-${tld.name}`} className="flex items-center space-x-2 p-1.5 border rounded-md hover:bg-muted/50">
                  <Checkbox
                    id={`popular-tld-${tld.name}`}
                    checked={selectedTlds.includes(tld.name)}
                    onCheckedChange={() => handleTldToggle(tld.name)}
                    className="shrink-0"
                  />
                  <label
                    htmlFor={`popular-tld-${tld.name}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer truncate"
                    title={tld.displayName}
                  >
                    {tld.displayName}
                  </label>
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
            <AccordionItem value="all-tlds-item">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                {isAllTldsExpanded ? t('hideAllButton') : t('showAllButton', { count: allAvailableTlds.length })}
              </AccordionTrigger>
              <AccordionContent className="mt-2">
                <ScrollArea className="h-[300px] w-full pr-3">
                  {renderTldList(allSortedTlds, 'all-sorted')}
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      ) : (
        // Search Results Section
        <div className='space-y-2'>
            <h3 className="text-sm font-semibold text-muted-foreground">
                {t('searchResults', { count: searchResults.length })}
            </h3>
            <ScrollArea className="h-[calc(300px+80px)] w-full pr-3"> {/* Increased height for search results */}
                {renderTldList(searchResults, 'search')}
            </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default TldSelector; 