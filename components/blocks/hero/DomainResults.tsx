import React from 'react';
import { DomainCheckResult } from '@/types/domain';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DomainResultsProps {
  results: DomainCheckResult[];
  loading: boolean;
  error: string | null;
}

export default function DomainResults({ results, loading, error }: DomainResultsProps) {
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
              <p className="text-sm text-muted-foreground">
                TLD: {result.tld}
              </p>
            </div>
            <Badge variant={result.available ? "default" : "destructive"}>
              {result.available ? 'Available' : 'Taken'}
            </Badge>
          </div>
          {result.error && (
            <p className="mt-2 text-sm text-red-500">{result.error}</p>
          )}
        </Card>
      ))}
    </div>
  );
} 