'use client'

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle, XCircle, Wallet, RefreshCw } from 'lucide-react'
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
      <div className="px-4 py-6 pb-24 md:pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="pixel-font text-xl text-purple-800 mb-2">MY POSITIONS</h1>
          </div>
          <div className="bg-white border-4 border-purple-300 p-8 text-center" style={{boxShadow: '6px 6px 0 rgba(0,0,0,0.1)'}}>
            <Wallet className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <p className="pixel-font text-sm text-gray-600 mb-4">CONNECT WALLET TO VIEW POSITIONS</p>
            <button
              onClick={openWalletModal}
              className="pixel-font text-xs bg-purple-500 hover:bg-purple-400 text-white px-6 py-3 border-b-4 border-purple-700"
            >
              CONNECT WALLET
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h1 className="pixel-font text-xl text-purple-800 mb-2">MY POSITIONS</h1>
            <p className="text-gray-600 text-sm">Track your options trades 📊</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 border-2 border-purple-300 bg-white hover:bg-purple-50 ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`bg-white border-4 p-3 text-center ${totalPnL >= 0 ? 'border-green-400' : 'border-red-400'}`} style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'}}>
            <div className={`pixel-font text-sm ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </div>
            <div className="text-[8px] text-gray-400">TOTAL P&L</div>
          </div>
          <div className="bg-white border-4 border-blue-400 p-3 text-center" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'}}>
            <div className="pixel-font text-sm text-blue-600">{activeCount}</div>
            <div className="text-[8px] text-gray-400">ACTIVE</div>
          </div>
          <div className="bg-white border-4 border-green-400 p-3 text-center" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'}}>
            <div className="pixel-font text-sm text-green-600">{wonCount}</div>
            <div className="text-[8px] text-gray-400">WON</div>
          </div>
          <div className="bg-white border-4 border-red-400 p-3 text-center" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'}}>
            <div className="pixel-font text-sm text-red-600">{lostCount}</div>
            <div className="text-[8px] text-gray-400">LOST</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'active', 'closed'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`flex-1 pixel-font text-[8px] py-2 border-2 transition-all ${
                filter === f 
                  ? 'bg-purple-500 text-white border-purple-700' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white border-4 border-purple-300 p-8 text-center" style={{boxShadow: '6px 6px 0 rgba(0,0,0,0.1)'}}>
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-purple-400 animate-spin" />
            <p className="pixel-font text-xs text-gray-500">LOADING POSITIONS...</p>
          </div>
        )}

        {/* Positions List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredPositions.length === 0 ? (
              <div className="bg-white border-4 border-gray-300 p-8 text-center" style={{boxShadow: '6px 6px 0 rgba(0,0,0,0.1)'}}>
                <span className="text-4xl mb-4 block">📭</span>
                <p className="pixel-font text-xs text-gray-500">NO POSITIONS YET</p>
                <p className="text-gray-400 text-sm mt-2">Start swiping to open your first trade!</p>
              </div>
            ) : (
              filteredPositions.map((position) => (
                <div 
                  key={position.id}
                  className={`bg-white border-4 p-4 transition-all ${
                    position.status === 'ACTIVE' 
                      ? position.type === 'CALL' ? 'border-green-400' : 'border-red-400'
                      : position.status === 'WON' ? 'border-green-300' : 'border-gray-300'
                  }`}
                  style={{boxShadow: '6px 6px 0 rgba(0,0,0,0.1)'}}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 border-4 flex items-center justify-center ${
                        position.asset === 'ETH' 
                          ? 'bg-blue-400 border-blue-600' 
                          : position.asset === 'BTC'
                            ? 'bg-orange-400 border-orange-600'
                            : 'bg-purple-400 border-purple-600'
                      }`}>
                        <span className="pixel-font text-[8px] text-white">{position.asset}</span>
                      </div>
                      <div>
                        <div className={`pixel-font text-xs ${position.type === 'CALL' ? 'text-green-600' : 'text-red-600'}`}>
                          {position.type} ${position.strike.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          {position.expiresIn}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 border-2 ${
                      position.status === 'ACTIVE' ? 'bg-blue-100 border-blue-400 text-blue-700' :
                      position.status === 'WON' ? 'bg-green-100 border-green-400 text-green-700' :
                      'bg-red-100 border-red-400 text-red-700'
                    }`}>
                      {position.status === 'ACTIVE' && <AlertCircle className="w-3 h-3" />}
                      {position.status === 'WON' && <CheckCircle className="w-3 h-3" />}
                      {position.status === 'LOST' && <XCircle className="w-3 h-3" />}
                      <span className="pixel-font text-[8px]">{position.status}</span>
                    </div>
                  </div>

                  {/* P&L Display */}
                  <div className={`flex items-center justify-between p-3 border-2 ${
                    position.pnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {position.pnl >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className={`pixel-font text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USD
                        </div>
                        <div className={`text-[10px] ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
    </div>
  )
}
