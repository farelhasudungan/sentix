'use client'

import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle, XCircle, Wallet, RefreshCw, BarChart3, ExternalLink, Share2, X } from 'lucide-react'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { fetchUserPositions, fetchUserHistory, formatPosition } from '@/lib/api/positions'
import { createPost } from '@/lib/api/feed'
import { useWalletModal } from '@/context/WalletModalContext'

export default function PositionPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all')
  const { address, isConnected } = useAccount()
  const { openWalletModal } = useWalletModal()
  
  // Share modal state
  const [shareModal, setShareModal] = useState<{
    show: boolean
    position: ReturnType<typeof formatPosition> | null
  }>({ show: false, position: null })
  const [shareContent, setShareContent] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

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
  const allPositions = [...formattedOpen, ...formattedHistory].sort((a, b) => b.raw.entryTimestamp - a.raw.entryTimestamp)

  const filteredPositions = allPositions.filter(pos => {
    if (filter === 'active') return pos.status === 'ACTIVE' || pos.status === 'EXPIRED'
    if (filter === 'closed') return pos.status === 'WON' || pos.status === 'LOST'
    return true
  })

  const totalPnL = allPositions.reduce((sum, pos) => sum + pos.pnl, 0)
  const activeCount = allPositions.filter(p => p.status === 'ACTIVE').length
  const expiredCount = allPositions.filter(p => p.status === 'EXPIRED').length
  const wonCount = allPositions.filter(p => p.status === 'WON').length
  const lostCount = allPositions.filter(p => p.status === 'LOST').length

  const handleRefresh = () => {
    refetchOpen()
    refetchHistory()
  }

  const openShareModal = (position: ReturnType<typeof formatPosition>) => {
    const defaultContent = `Just opened a ${position.type} position on ${position.asset}! 🚀\n\nStrike: $${position.strike.toLocaleString()}\nExpiry: ${position.expiry}\n\n#Sentix #DeFi #Options`
    setShareContent(defaultContent)
    setShareModal({ show: true, position })
    setShareSuccess(false)
  }

  const handleShare = async () => {
    if (!address || !shareModal.position || !shareContent.trim()) return

    setIsSharing(true)
    try {
      await createPost(shareContent.trim(), address, {
        asset: shareModal.position.asset,
        type: shareModal.position.type as 'CALL' | 'PUT',
        strike: shareModal.position.strike,
        expiry: shareModal.position.expiry,
        expiryTimestamp: shareModal.position.raw.expiryTimestamp,
        premium: shareModal.position.premium,
        currentPrice: 0, // Not available for existing positions
      })
      setShareSuccess(true)
      setTimeout(() => {
        setShareModal({ show: false, position: null })
        setShareContent('')
        setShareSuccess(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to share:', error)
    } finally {
      setIsSharing(false)
    }
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
        <div className="backdrop-blur-sm border border-gray-500/30 rounded-xl p-4 text-center" style={{ background: 'rgba(26,26,26,0.8)' }}>
          <div className="text-xl font-bold text-gray-400">{expiredCount}</div>
          <div className="text-[10px] text-gray-500 uppercase mt-1">Expired</div>
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
                    : position.status === 'EXPIRED'
                      ? 'border-gray-500/30'
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
                      {position.asset === 'UNKNOWN' ? '?' : position.asset}
                    </div>
                    <div>
                      <div className={`font-semibold ${position.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                        {position.type} ${position.strike.toLocaleString()}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {position.status === 'ACTIVE' ? (
                            <CountdownTimer expiryTimestamp={position.raw.expiryTimestamp} />
                          ) : (
                            <span>{position.expiresIn}</span>
                          )}
                        </div>
                        <span>•</span>
                        <span>Opened: {position.createdDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    position.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    position.status === 'EXPIRED' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                    position.status === 'WON' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {position.status === 'ACTIVE' && <AlertCircle className="w-3.5 h-3.5" />}
                    {position.status === 'EXPIRED' && <Clock className="w-3.5 h-3.5" />}
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
                        {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(6)} USD
                      </div>
                      <div className={`text-xs ${position.pnl >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>Premium: ${position.premium.toFixed(6)}</div>
                    <div>Strike: ${position.strike.toLocaleString()}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {/* Entry Tx on BaseScan */}
                  {position.entryTxHash && (
                    <a
                      href={`https://basescan.org/tx/${position.entryTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Entry Tx
                    </a>
                  )}
                  
                  {/* Close Tx on BaseScan (for settled positions) */}
                  {position.closeTxHash && (
                    <a
                      href={`https://basescan.org/tx/${position.closeTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Settlement Tx
                    </a>
                  )}
                  
                  {/* Share to Feed (only for active positions) */}
                  {position.status === 'ACTIVE' && (
                    <button
                      onClick={() => openShareModal(position)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share to Feed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Share Modal */}
      {shareModal.show && shareModal.position && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShareModal({ show: false, position: null })}
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, rgba(38,38,38,0.98) 0%, rgba(26,26,26,0.99) 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Share to Feed</h3>
                  <p className="text-xs text-gray-400">Share your trade with the community</p>
                </div>
              </div>
              <button
                onClick={() => setShareModal({ show: false, position: null })}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trade Preview */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    shareModal.position.type === 'CALL' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {shareModal.position.asset}
                  </div>
                  <div>
                    <div className={`font-semibold ${shareModal.position.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                      {shareModal.position.type}
                    </div>
                    <div className="text-xs text-gray-500">${shareModal.position.strike.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-medium">Expires</div>
                  <div className="text-xs text-gray-500">{shareModal.position.expiry}</div>
                </div>
              </div>
            </div>

            {/* Content Input */}
            <div className="p-4">
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Write something about your trade..."
                maxLength={500}
                className="w-full h-32 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs ${shareContent.length > 450 ? 'text-amber-400' : 'text-gray-500'}`}>
                  {shareContent.length}/500
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 pt-0">
              <button
                onClick={() => setShareModal({ show: false, position: null })}
                disabled={isSharing}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || !shareContent.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-colors disabled:opacity-50"
              >
                {shareSuccess ? '✓ Shared!' : isSharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
