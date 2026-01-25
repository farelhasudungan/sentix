'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, BarChart3, Bot, Settings, Bell, User, Wallet, LogOut, MessageSquare, X, ExternalLink, CheckCircle, Trash2 } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletModal } from '@/context/WalletModalContext'
import { useNotifications } from '@/context/NotificationContext'
import { useUserAlias } from '@/hooks/useUserAlias'

const navItems = [
  { href: '/trade', label: 'Home', icon: Home },
  { href: '/trade/feed', label: 'Feed', icon: MessageSquare },
  { href: '/trade/games', label: 'Games', icon: Trophy },
  { href: '/trade/position', label: 'Positions', icon: BarChart3 },
  { href: '/trade/agent', label: 'AI Help', icon: Bot },
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

// User profile display component with alias support
function UserProfileDisplay({ address, onDisconnect }: { address: string; onDisconnect: () => void }) {
  const { displayName, isCustomAlias } = useUserAlias(address)
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #22c55e, #10b981)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p 
          className="text-sm font-medium truncate"
          style={{ color: isCustomAlias ? '#fbbf24' : '#fff' }}
          title={address}
        >
          {displayName}
        </p>
        <p className="text-gray-500 text-xs">Connected</p>
      </div>
      <button
        onClick={onDisconnect}
        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        title="Disconnect"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}

export function Sidebar() {
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
      <aside className="hidden md:flex flex-col fixed left-4 top-4 bottom-4 w-60 backdrop-blur-xl border border-white/10 rounded-2xl z-50 overflow-visible" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}>
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
          <Link href="/trade/settings">
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-200">
              <Settings className="w-4 h-4" />
              <span className="text-xs font-medium">Settings</span>
            </div>
          </Link>
          
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] bg-amber-400 rounded-full text-[8px] font-bold text-black flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Notifications</span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div 
                className="absolute left-full bottom-0 ml-2 w-80 max-h-96 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
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
                          className={`p-3 hover:bg-white/5 transition-colors cursor-pointer ${!notification.is_read ? 'bg-amber-500/5' : ''}`}
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
        </div>

        {/* User Profile / Wallet */}
        <div className="p-4 border-t border-white/10">
          {isConnected && address ? (
            <UserProfileDisplay address={address} onDisconnect={disconnect} />
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

      {/* Backdrop for notification dropdown on desktop */}
      {showNotifications && (
        <div 
          className="hidden md:block fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  )
}
