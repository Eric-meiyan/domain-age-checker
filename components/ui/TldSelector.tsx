'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
// Button component is not used in the current version, can be removed if not planned for future use
// import { Button } from '@/components/ui/button'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// 假设 TLD 数据已经正确导入并符合 Tld 接口
// 在实际项目中，这个 JSON 文件可能需要通过API路由获取或在构建时处理
import tldConfig from '@/app/config/tld-config.json';
import { Tld } from '@/types/tld';

interface TldSelectorProps {
  selectedTlds: string[];
  onChange: (selected: string[]) => void;
  maxPopular?: number;
}

const TldSelector: React.FC<TldSelectorProps> = ({
  selectedTlds,
  onChange,
  maxPopular = 15,
}) => {
  const t = useTranslations('TldSelector');
  const allAvailableTlds: Tld[] = useMemo(() => tldConfig.tlds.filter(tld => tld.enabled), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAllTldsExpanded, setIsAllTldsExpanded] = useState(false);

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

  return (
    <div className="space-y-4 p-3 border rounded-lg w-full">
      <Input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />

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
                {t('allTlds')} {/* This title could be more specific like "Search Results" */}
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