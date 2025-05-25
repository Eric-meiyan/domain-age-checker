import React, { useState } from 'react';
import { DomainCheckResult } from '@/types/domain';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface DomainResultsProps {
  results: DomainCheckResult[];
  loading: boolean;
  error: string | null;
}

export default function DomainResults({ results, loading, error }: DomainResultsProps) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const toggleExpand = (domain: string) => {
    if (expandedDomain === domain) {
      setExpandedDomain(null);
    } else {
      setExpandedDomain(domain);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-4">
      {results.map((result) => (
        <Card key={result.domain} className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">{result.domain}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  TLD: {result.tld}
                </p>
                {result.method && (
                  <Badge variant="outline" className="text-xs">
                    {result.method}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={result.available ? "default" : "destructive"}>
                {result.available ? 'Available' : 'Taken'}
              </Badge>
              
              {result.rdapData && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleExpand(result.domain)}
                  className="h-8 w-8 p-0"
                >
                  {expandedDomain === result.domain ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {result.error && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-500">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{result.error}</p>
            </div>
          )}
          
          {expandedDomain === result.domain && result.rdapData && (
            <div className="mt-4 border-t pt-3 text-sm">
              <h4 className="font-medium mb-2">RDAP Data</h4>
              
              <div className="space-y-2">
                {result.rdapData.handle && (
                  <p><span className="font-medium">Handle:</span> {result.rdapData.handle}</p>
                )}
                
                {result.rdapData.ldhName && (
                  <p><span className="font-medium">Domain Name:</span> {result.rdapData.ldhName}</p>
                )}
                
                {result.rdapData.status && (
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    {Array.isArray(result.rdapData.status) 
                      ? result.rdapData.status.join(', ') 
                      : result.rdapData.status}
                  </div>
                )}
                
                {result.rdapData.events && result.rdapData.events.length > 0 && (
                  <div>
                    <span className="font-medium">Events:</span>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {result.rdapData.events.map((event: any, index: number) => (
                        <li key={index}>
                          {event.eventAction}: {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'N/A'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
} 