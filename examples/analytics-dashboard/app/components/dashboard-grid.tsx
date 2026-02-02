'use client'

import React, { useState, useEffect } from 'react'
import { LineChartComponent } from '@/app/components/charts/line-chart'
import { BarChartComponent } from '@/app/components/charts/bar-chart'
import { PieChartComponent } from '@/app/components/charts/pie-chart'
import { AreaChartComponent } from '@/app/components/charts/area-chart'
import { MetricCard } from '@/app/components/widgets/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Download, RefreshCw, Filter } from 'lucide-react'

// Mock data generators
const generateTimeSeriesData = (days: number) => {
  const data = []
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pageViews: Math.floor(Math.random() * 5000) + 1000,
      sessions: Math.floor(Math.random() * 3000) + 500,
      purchases: Math.floor(Math.random() * 200) + 50,
      conversionRate: parseFloat((Math.random() * 5 + 1).toFixed(2)),
    })
  }
  return data
}

const generatePieData = () => [
  { name: 'Desktop', value: 65 },
  { name: 'Mobile', value: 30 },
  { name: 'Tablet', value: 5 },
]

const generateMetricData = () => ({
  totalRevenue: {
    value: 124500,
    previous: 98700,
    format: 'currency' as const,
    prefix: '$',
  },
  totalOrders: {
    value: 1250,
    previous: 980,
    format: 'number' as const,
  },
  conversionRate: {
    value: 3.24,
    previous: 2.89,
    format: 'percentage' as const,
  },
  activeUsers: {
    value: 45230,
    previous: 42100,
    format: 'number' as const,
  },
})

export function DashboardGrid() {
  const [timeRange, setTimeRange] = useState(7)
  const [data, setData] = useState(generateTimeSeriesData(7))
  const [metrics, setMetrics] = useState(generateMetricData())
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setData(generateTimeSeriesData(timeRange))
      setMetrics(generateMetricData())
      setIsLoading(false)
    }, 1000)
  }

  useEffect(() => {
    refreshData()
  }, [timeRange])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your key metrics and performance indicators
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[
          { label: '24 Hours', value: 1 },
          { label: '7 Days', value: 7 },
          { label: '30 Days', value: 30 },
          { label: '90 Days', value: 90 },
        ].map((range) => (
          <Button
            key={range.value}
            variant={timeRange === range.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={metrics.totalRevenue.value}
          previousValue={metrics.totalRevenue.previous}
          format={metrics.totalRevenue.format}
          prefix={metrics.totalRevenue.prefix}
          description="Compared to previous period"
          sparkline={[100, 120, 110, 140, 130, 150, 160, 180]}
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders.value}
          previousValue={metrics.totalOrders.previous}
          format={metrics.totalOrders.format}
          description="Compared to previous period"
          sparkline={[80, 90, 85, 100, 95, 110, 105, 125]}
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.conversionRate.value}
          previousValue={metrics.conversionRate.previous}
          format={metrics.conversionRate.format}
          description="Compared to previous period"
          sparkline={[2.1, 2.5, 2.8, 3.0, 2.9, 3.2, 3.1, 3.24]}
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.value}
          previousValue={metrics.activeUsers.previous}
          format={metrics.activeUsers.format}
          description="Compared to previous period"
          sparkline={[40000, 41000, 40500, 42000, 41800, 43000, 44000, 45230]}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
          <LineChartComponent
            title="Traffic Overview"
            data={data}
            lines={[
              { dataKey: 'pageViews', color: '#3b82f6', name: 'Page Views' },
              { dataKey: 'sessions', color: '#10b981', name: 'Sessions' },
            ]}
            height={350}
          />
        </div>
        <PieChartComponent
          title="Device Distribution"
          data={generatePieData()}
          height={350}
        />
        <div className="col-span-2">
          <AreaChartComponent
            title="Revenue & Conversions"
            data={data}
            areas={[
              { dataKey: 'purchases', color: '#8b5cf6', name: 'Purchases' },
              { dataKey: 'conversionRate', color: '#f59e0b', name: 'Conversion Rate' },
            ]}
            height={300}
            stacked
          />
        </div>
        <BarChartComponent
          title="Daily Performance"
          data={data.slice(-7)}
          bars={[
            { dataKey: 'pageViews', color: '#3b82f6', name: 'Page Views' },
            { dataKey: 'sessions', color: '#10b981', name: 'Sessions' },
          ]}
          height={300}
        />
      </div>

      {/* Data Table Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Page Views</th>
                  <th className="px-6 py-3">Sessions</th>
                  <th className="px-6 py-3">Purchases</th>
                  <th className="px-6 py-3">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-5).reverse().map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-6 py-4">{row.name}</td>
                    <td className="px-6 py-4">{row.pageViews.toLocaleString()}</td>
                    <td className="px-6 py-4">{row.sessions.toLocaleString()}</td>
                    <td className="px-6 py-4">{row.purchases}</td>
                    <td className="px-6 py-4">{row.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
