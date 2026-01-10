'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, BarChart3, Bot, Wallet, User, LogOut, Search, Bell } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletModal } from '@/context/WalletModalContext'

const navItems = [
  { href: '/trade', label: 'Home', icon: Home },
  { href: '/trade/games', label: 'Games', icon: Trophy },
  { href: '/trade/position', label: 'Positions', icon: BarChart3 },
  { href: '/trade/agent', label: 'AI Help', icon: Bot },
]

export function MobileNav() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openWalletModal } = useWalletModal()

  return (
    <>
      {/* Top Navbar - Floating Glass Effect */}
      <header className="md:hidden fixed top-3 left-3 right-3 h-14 backdrop-blur-xl border border-white/10 rounded-2xl z-50 px-4 flex items-center justify-between overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}>
        {/* Logo */}
        <Link href="/trade" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}>
            <span className="text-sm">⭐</span>
          </div>
          <span className="font-bold text-white text-base tracking-wide">Sentix</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-white transition-colors relative rounded-lg hover:bg-white/5">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" style={{ boxShadow: '0 0 8px rgba(251,191,36,0.6)' }} />
          </button>
          
          {isConnected && address ? (
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #22c55e, #10b981)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
                <User className="w-4 h-4 text-white" />
              </div>
              <button
                onClick={() => disconnect()}
                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openWalletModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(to bottom, #ffd48d, #b78751)', color: '#FFFDE5', textShadow: '0 -1px 0 rgb(178 140 2 / 100%)', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}
            >
              <Wallet className="w-4 h-4" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </header>

      {/* Bottom Tab Bar - Floating Glass Effect */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 h-16 backdrop-blur-xl border border-white/10 rounded-2xl z-50 px-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 -10px 40px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-around h-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className="flex flex-col items-center justify-center py-2">
                  <div
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'text-amber-400'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    style={isActive ? { background: 'rgba(251,191,36,0.15)', boxShadow: '0 0 12px rgba(251,191,36,0.2)' } : {}}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium ${
                      isActive ? 'text-amber-400' : 'text-gray-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
