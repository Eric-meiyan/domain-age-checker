'use client';

import { useState, useEffect } from 'react';
import { Tld, TldListResponse, fetchTlds } from '@/models/TldModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TldsAdminPage() {
  const [tlds, setTlds] = useState<Tld[]>([]);
  const [filteredTlds, setFilteredTlds] = useState<Tld[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTlds();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTlds(tlds);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredTlds(
        tlds.filter(tld => 
          tld.name.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, tlds]);

  const loadTlds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchTlds();
      
      if (response.success) {
        setTlds(response.data);
        setFilteredTlds(response.data);
        toast.success(`成功加载 ${response.count} 个TLD`);
      } else {
        setError(response.error || '未知错误');
        toast.error(`加载TLD失败: ${response.error}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      toast.error(`加载TLD失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>TLD 管理</CardTitle>
          <CardDescription>管理和查看所有可用的顶级域名 (TLDs)</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <div className="w-1/3">
              <Input
                placeholder="搜索TLD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={loadTlds}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  加载中...
                </>
              ) : '刷新'}
            </Button>
          </div>
          
          {error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700 mb-4">
              {error}
            </div>
          ) : null}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TLD</TableHead>
                  <TableHead>显示名称</TableHead>
                  <TableHead>RDAP 服务器</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <span className="mt-2 block">加载中...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredTlds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      未找到TLD
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTlds.slice(0, 100).map((tld) => (
                    <TableRow key={tld.name}>
                      <TableCell className="font-medium">{tld.name}</TableCell>
                      <TableCell>{tld.displayName || `.${tld.name}`}</TableCell>
                      <TableCell>
                        {tld.rdapServers && tld.rdapServers.length > 0 
                          ? tld.rdapServers[0] 
                          : <span className="text-gray-400">无服务器信息</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredTlds.length > 100 && (
            <div className="mt-2 text-sm text-gray-500">
              显示 100 个结果，共 {filteredTlds.length} 个结果
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div>
            <span className="text-sm text-gray-500">
              总计: {tlds.length} 个 TLD
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 