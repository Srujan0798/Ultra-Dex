import React from 'react';
import { ShoppingBag, Search, Filter, Download, Star, Shield, Code, TestTube, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MarketplacePage() {
  const categories = [
    { name: 'All', icon: ShoppingBag },
    { name: 'Coding', icon: Code },
    { name: 'Testing', icon: TestTube },
    { name: 'Security', icon: Shield },
    { name: 'DevOps', icon: Globe },
  ];

  const plugins = [
    {
      name: 'security-auditor',
      description: 'Advanced vulnerability scanner for Node.js and Python projects.',
      author: 'Ultra-Dex Core',
      downloads: '12.4k',
      rating: 4.9,
      category: 'Security',
      version: '1.2.0'
    },
    {
      name: 'api-documenter',
      description: 'Automatically generates OpenAPI schemas and documentation from source code.',
      author: 'OpenSource Labs',
      downloads: '8.2k',
      rating: 4.7,
      category: 'Coding',
      version: '2.0.1'
    },
    {
      name: 'performance-profiler',
      description: 'Identifies latency bottlenecks and suggests memory optimizations.',
      author: 'InfraTech',
      downloads: '5.1k',
      rating: 4.8,
      category: 'DevOps',
      version: '0.9.5'
    },
    {
      name: 'test-generator',
      description: 'Generates unit tests with 80%+ coverage for TypeScript components.',
      author: 'Ultra-Dex Core',
      downloads: '15.2k',
      rating: 4.9,
      category: 'Testing',
      version: '1.1.0'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-12 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Plugin Marketplace</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Extend Ultra-Dex with community-built agents, tools, and provider connectors.
        </p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search plugins, agents, tools..." 
            className="w-full bg-background border border-border rounded-full py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Filter size={14} />
              Categories
            </h3>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button 
                  key={cat.name}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <cat.icon size={16} />
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Sort By</h3>
            <select className="w-full bg-background border border-border rounded-lg p-2 text-sm">
              <option>Trending</option>
              <option>Most Downloaded</option>
              <option>Highest Rated</option>
              <option>Newest</option>
            </select>
          </div>
        </aside>

        {/* Plugin Grid */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plugins.map((plugin) => (
              <Card key={plugin.name} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                      <ShoppingBag className="text-primary" size={24} />
                    </div>
                    <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      {plugin.rating}
                    </div>
                  </div>
                  <CardTitle className="mt-4">{plugin.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{plugin.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download size={12} />
                      {plugin.downloads}
                    </span>
                    <span>v{plugin.version}</span>
                    <span className="bg-muted px-2 py-0.5 rounded italic">By {plugin.author}</span>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/50 pt-4 flex gap-3">
                  <Button variant="default" className="flex-1" asChild>
                    <Link href={`/marketplace/${plugin.name}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="secondary" size="sm">1</Button>
            <Button variant="ghost" size="sm">2</Button>
            <Button variant="ghost" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
