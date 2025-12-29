'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, User, Home, Trophy, BarChart3, X, Menu, ArrowLeft, LogOut } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWalletModal } from '@/context/WalletModalContext'


export default function TradeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openWalletModal } = useWalletModal()

  const navItems = [
    { href: '/trade', label: 'SWIPE', icon: Home},
    { href: '/trade/games', label: 'GAMES', icon: Trophy},
    { href: '/trade/position', label: 'POSITION', icon: BarChart3},
  ]

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-200 via-sky-100 to-green-200">
      {/* Pixel Art Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-600 border-b-4 border-purple-800" style={{boxShadow: '0 4px 0 rgba(0,0,0,0.2)'}}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo & Back */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <button className="bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-600 p-2 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-yellow-800" />
                </button>
              </Link>
              <Link href="/trade" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center">
                  <span className="text-sm">⭐</span>
                </div>
                <span className="pixel-font text-xs text-white hidden sm:block">OPTIXEL</span>
              </Link>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button className={`pixel-font text-[10px] px-4 py-2 transition-all flex items-center gap-2 ${
                    pathname === item.href 
                      ? 'bg-yellow-400 text-yellow-800 border-2 border-yellow-600' 
                      : 'bg-purple-500 text-white border-2 border-purple-700 hover:bg-purple-400'
                  }`}>
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isConnected && address ? (
                <div className="flex items-center gap-2">
                   <button className="pixel-font text-[8px] bg-green-400 text-white px-3 py-2 border-2 border-green-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block">{address.slice(0, 6)}...{address.slice(-4)}</span>
                  </button>
                  <button 
                    onClick={() => disconnect()}
                    className="bg-red-500 border-2 border-red-700 p-2 text-white hover:bg-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={openWalletModal}
                  className="pixel-font text-[8px] bg-yellow-400 hover:bg-yellow-300 text-yellow-800 px-3 py-2 border-2 border-yellow-600 flex items-center gap-2 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:block">CONNECT</span>
                </button>
              )}
              
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden bg-purple-500 border-2 border-purple-700 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-purple-700 border-t-2 border-purple-600 px-4 py-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <button className={`pixel-font text-[10px] w-full px-4 py-3 transition-all flex items-center gap-2 ${
                    pathname === item.href 
                      ? 'bg-yellow-400 text-yellow-800 border-2 border-yellow-600' 
                      : 'bg-purple-500 text-white border-2 border-purple-700 hover:bg-purple-400'
                  }`}>
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-purple-600 border-t-4 border-purple-800" style={{boxShadow: '0 -4px 0 rgba(0,0,0,0.2)'}}>
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className={`flex flex-col items-center px-4 py-2 transition-all ${
                pathname === item.href ? 'text-yellow-400' : 'text-white'
              }`}>
                <span className="pixel-font text-[6px] mt-1">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
