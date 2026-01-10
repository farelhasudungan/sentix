'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pt-20 pb-24 md:pt-8 md:pb-8">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
