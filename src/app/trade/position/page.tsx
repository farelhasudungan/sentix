'use client'

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle, XCircle, Wallet, RefreshCw, BarChart3 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { fetchUserPositions, fetchUserHistory, formatPosition } from '@/lib/api/positions'
import { useWalletModal } from '@/context/WalletModalContext'

export default function PositionPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all')
  const { address, isConnected } = useAccount()
  const { openWalletModal } = useWalletModal()

  // Fetch open positions
  const { data: openPositions = [], isLoading: loadingOpen, refetch: refetchOpen } = useQuery({
    queryKey: ['user-positions', address],
    queryFn: () => fetchUserPositions(address || ''),
    enabled: !!address,
    refetchInterval: 30000,
  })

  // Fetch settled history
  const { data: historyPositions = [], isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['user-history', address],
    queryFn: () => fetchUserHistory(address || ''),
    enabled: !!address,
    refetchInterval: 30000,
  })

  const isLoading = loadingOpen || loadingHistory

  // Format and combine positions
  const formattedOpen = openPositions.map(formatPosition)
  const formattedHistory = historyPositions.map(formatPosition)
  const allPositions = [...formattedOpen, ...formattedHistory]

  const filteredPositions = allPositions.filter(pos => {
    if (filter === 'active') return pos.status === 'ACTIVE'
    if (filter === 'closed') return pos.status === 'WON' || pos.status === 'LOST'
    return true
  })

  const totalPnL = allPositions.reduce((sum, pos) => sum + pos.pnl, 0)
  const activeCount = allPositions.filter(p => p.status === 'ACTIVE').length
  const wonCount = allPositions.filter(p => p.status === 'WON').length
  const lostCount = allPositions.filter(p => p.status === 'LOST').length

  const handleRefresh = () => {
    refetchOpen()
    refetchHistory()
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Positions</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">My Positions</h1>
        </div>
        <div className="bg-[#1a1a2e]/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-white font-medium mb-2">Connect Your Wallet</p>
          <p className="text-gray-500 text-sm mb-6">View your positions and trade history</p>
          <button
            onClick={openWalletModal}
            className="text-black font-semibold px-6 py-3 rounded-xl transition-all"
            style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Positions</span>
          </div>
          <h1 className="text-2xl font-bold text-white">My Positions</h1>
          <p className="text-gray-400 text-sm mt-1">Track your options trades 📊</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`backdrop-blur-sm border rounded-xl p-4 text-center ${totalPnL >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`} style={{ background: 'rgba(26,26,26,0.8)' }}>
          <div className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500 uppercase mt-1">Total P&L</div>
        </div>
        <div className="backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 text-center" style={{ background: 'rgba(26,26,26,0.8)' }}>
          <div className="text-xl font-bold text-blue-400">{activeCount}</div>
          <div className="text-[10px] text-gray-500 uppercase mt-1">Active</div>
        </div>
        <div className="backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center" style={{ background: 'rgba(26,26,26,0.8)' }}>
          <div className="text-xl font-bold text-green-400">{wonCount}</div>
          <div className="text-[10px] text-gray-500 uppercase mt-1">Won</div>
        </div>
        <div className="backdrop-blur-sm border border-red-500/30 rounded-xl p-4 text-center" style={{ background: 'rgba(26,26,26,0.8)' }}>
          <div className="text-xl font-bold text-red-400">{lostCount}</div>
          <div className="text-[10px] text-gray-500 uppercase mt-1">Lost</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'closed'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === f 
                ? 'text-black' 
                : 'text-gray-400 border border-white/10 hover:text-white'
            }`}
            style={filter === f 
              ? { background: 'linear-gradient(to right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }
              : { background: 'rgba(255,255,255,0.05)' }
            }
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-[#1a1a2e]/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-sm text-gray-500">Loading positions...</p>
        </div>
      )}

      {/* Positions List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredPositions.length === 0 ? (
            <div className="bg-[#1a1a2e]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-white font-medium mb-2">No Positions Yet</p>
              <p className="text-gray-500 text-sm">Start swiping to open your first trade!</p>
            </div>
          ) : (
            filteredPositions.map((position) => (
              <div 
                key={position.id}
                className={`bg-[#1a1a2e]/50 backdrop-blur-sm border rounded-2xl p-5 transition-all hover:-translate-y-1 ${
                  position.status === 'ACTIVE' 
                    ? position.type === 'CALL' ? 'border-green-500/30' : 'border-red-500/30'
                    : position.status === 'WON' ? 'border-green-500/20' : 'border-white/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${
                      position.asset === 'ETH' 
                        ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' 
                        : position.asset === 'BTC'
                          ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400'
                          : 'bg-gray-500/20 border border-gray-500/30 text-gray-400'
                    }`}>
                      {position.asset}
                    </div>
                    <div>
                      <div className={`font-semibold ${position.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                        {position.type} ${position.strike.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {position.expiresIn}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    position.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    position.status === 'WON' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {position.status === 'ACTIVE' && <AlertCircle className="w-3.5 h-3.5" />}
                    {position.status === 'WON' && <CheckCircle className="w-3.5 h-3.5" />}
                    {position.status === 'LOST' && <XCircle className="w-3.5 h-3.5" />}
                    {position.status}
                  </div>
                </div>

                {/* P&L Display */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  position.pnl >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {position.pnl >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <div className={`font-bold text-lg ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USD
                      </div>
                      <div className={`text-xs ${position.pnl >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>Premium: ${position.premium.toFixed(2)}</div>
                    <div>Strike: ${position.strike.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
