'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, BarChart3, Bot, Settings, Bell, User, Wallet, LogOut } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletModal } from '@/context/WalletModalContext'

const navItems = [
  { href: '/trade', label: 'Home', icon: Home },
  { href: '/trade/games', label: 'Games', icon: Trophy },
  { href: '/trade/position', label: 'Positions', icon: BarChart3 },
  { href: '/trade/agent', label: 'AI Help', icon: Bot },
]

const bottomNavItems = [
  { href: '/trade/settings', label: 'Settings', icon: Settings },
  { href: '/trade/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openWalletModal } = useWalletModal()

  return (
    <aside className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-60 backdrop-blur-xl border border-white/10 rounded-2xl z-50 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/trade" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}>
            <span className="text-lg">⭐</span>
          </div>
          <span className="font-bold text-white text-xl tracking-wide">Sentix</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { background: 'linear-gradient(to right, rgba(251,191,36,0.15), rgba(245,158,11,0.05))' } : {}}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'group-hover:text-white'}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 8px rgba(251,191,36,0.6)' }} />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section - Settings & Notifications */}
      <div className="p-4 space-y-1 border-t border-white/10">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-200">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* User Profile / Wallet */}
      <div className="p-4 border-t border-white/10">
        {isConnected && address ? (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #22c55e, #10b981)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <p className="text-gray-500 text-xs">Connected</p>
            </div>
            <button
              onClick={() => disconnect()}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={openWalletModal}
            className="w-full relative rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #917100, #EAD98F)', padding: '1px', borderRadius: 'inherit' }} />
            <div className="relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm" style={{ background: 'linear-gradient(to bottom, #ffd48d, #b78751)', color: '#FFFDE5', textShadow: '0 -1px 0 rgb(178 140 2 / 100%)' }}>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </div>
          </button>
        )}
      </div>
    </aside>
  )
}
