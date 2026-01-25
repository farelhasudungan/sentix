'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, BarChart3, Bot, Wallet, User, LogOut, Search, Bell, MessageSquare, X, ExternalLink, CheckCircle, Trash2, Settings } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletModal } from '@/context/WalletModalContext'
import { useNotifications } from '@/context/NotificationContext'

const navItems = [
  { href: '/trade', label: 'Home', icon: Home },
  { href: '/trade/feed', label: 'Feed', icon: MessageSquare },
  { href: '/trade/games', label: 'Games', icon: Trophy },
  { href: '/trade/position', label: 'Positions', icon: BarChart3 },
  { href: '/trade/agent', label: 'AI', icon: Bot },
]

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function MobileNav() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openWalletModal } = useWalletModal()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      markAllAsRead()
    }
  }

  return (
    <>
      {/* Top Navbar - Floating Glass Effect */}
      <header className="md:hidden fixed top-3 left-3 right-3 h-14 backdrop-blur-xl border border-white/10 rounded-2xl z-50 px-4 flex items-center justify-between overflow-visible" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}>
        {/* Logo */}
        <Link href="/trade" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}>
            <span className="text-sm">⭐</span>
          </div>
          <span className="font-bold text-white text-base tracking-wide">Sentix</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Link href="/trade/settings" className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <Settings className="w-5 h-5" />
          </Link>
          
          {/* Notification Button */}
          <div className="relative">
            <button 
              onClick={handleNotificationClick}
              className="p-2 text-gray-500 hover:text-white transition-colors relative rounded-lg hover:bg-white/5"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-amber-400 rounded-full text-[9px] font-bold text-black flex items-center justify-center px-0.5" style={{ boxShadow: '0 0 8px rgba(251,191,36,0.6)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div 
                className="absolute right-0 top-12 w-80 max-h-96 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
                style={{ background: 'rgba(26,26,26,0.98)', backdropFilter: 'blur(20px)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Clear all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-white/5 transition-colors ${!notification.is_read ? 'bg-amber-500/5' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              notification.type === 'trade_success' ? 'bg-green-500/20' : 
                              notification.type === 'trade_error' ? 'bg-red-500/20' : 'bg-blue-500/20'
                            }`}>
                              <CheckCircle className={`w-4 h-4 ${
                                notification.type === 'trade_success' ? 'text-green-400' : 
                                notification.type === 'trade_error' ? 'text-red-400' : 'text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{notification.title}</p>
                              <p className="text-gray-400 text-xs mt-0.5">{notification.message}</p>
                              {notification.tx_hash && (
                                <a
                                  href={`https://basescan.org/tx/${notification.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-400 hover:text-blue-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View on BaseScan
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              <p className="text-gray-600 text-[10px] mt-1">{formatTimeAgo(new Date(notification.created_at))}</p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-amber-400 rounded-full shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
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

      {/* Backdrop for notification dropdown */}
      {showNotifications && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowNotifications(false)}
        />
      )}

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
