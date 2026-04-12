import React from 'react';
import { 
  ArrowLeft, 
  Download, 
  Star, 
  History, 
  Package, 
  ExternalLink,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PluginDetailPage({ params }: { params: { name: string } }) {
  const name = params.name;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/marketplace" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20 shadow-inner">
          <Package className="text-primary" size={64} />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{name}</h1>
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
              OFFICIAL
            </span>
          </div>
          <p className="text-xl text-muted-foreground">
            A production-grade extension for Ultra-Dex to enhance system capabilities.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="text-yellow-500 fill-yellow-500" size={16} />
              <span className="font-bold">4.9</span>
              <span className="text-muted-foreground">(128 reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Download size={16} />
              <span className="font-medium text-foreground">12,402</span> installs
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <History size={16} />
              Updated 2 days ago
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <Button size="lg" className="w-full md:w-48 gap-2">
            <Download size={18} />
            Install Plugin
          </Button>
          <Button variant="outline" size="lg" className="w-full md:w-48 gap-2">
            <ExternalLink size={18} />
            Source Code
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-8">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Overview</TabsTrigger>
          <TabsTrigger value="versions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Versions</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Reviews</TabsTrigger>
          <TabsTrigger value="dependencies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-2xl font-bold">About this plugin</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The {name} plugin provides a set of advanced features designed to integrate seamlessly 
                  with the Ultra-Dex core. It leverages machine learning models to provide real-time analysis 
                  and automated remediation for complex system tasks.
                </p>
                <h4 className="text-lg font-bold mt-6">Key Features</h4>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Real-time monitoring and event broadcasting.</li>
                  <li>Automated pattern recognition for system anomalies.</li>
                  <li>Zero-config integration with existing Ultra-Dex workflows.</li>
                  <li>High-performance data processing using Rust-based core modules.</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-mono">1.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License</span>
                    <span>MIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span>4.2 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform</span>
                    <span>Cross-platform</span>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3 items-start">
                <ShieldCheck className="text-green-500 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-green-500">Security Verified</p>
                  <p className="text-xs text-green-500/70">Scanned for vulnerabilities and malicious code.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y border-border">
                {[
                  { v: '1.2.0', d: '2026-04-10', n: 'Added support for NVIDIA NIM providers.' },
                  { v: '1.1.5', d: '2026-03-25', n: 'Performance improvements in data serialization.' },
                  { v: '1.1.0', d: '2026-03-12', n: 'Initial stable release with core agent support.' },
                ].map((ver) => (
                  <div key={ver.v} className="p-6 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">v{ver.v}</span>
                        <span className="text-xs text-muted-foreground">{ver.d}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{ver.n}</p>
                    </div>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Community Feedback</h3>
              <Button variant="outline" className="gap-2">
                <MessageSquare size={16} />
                Write a Review
              </Button>
            </div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                          U{i}
                        </div>
                        <div>
                          <p className="text-sm font-bold">User_{i}42</p>
                          <p className="text-[10px] text-muted-foreground">Software Engineer</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-yellow-500">
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Outstanding plugin! Saved me hours of manual configuration. The integration with 
                      the core system is seamless and the performance is top-notch.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
