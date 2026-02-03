'use client'

import React, { useState } from 'react'
import { Sidebar, Header } from '@/app/components/layout'
import { DashboardGrid } from '@/app/components/dashboard-grid'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <DashboardGrid />
        </main>
      </div>
    </div>
  )
}
