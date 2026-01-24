'use client'

import React, { useState, useMemo } from 'react'
import { X, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import type { AttachedTrade, Option } from '@/types'
import { createPost } from '@/lib/api/feed'
import { fetchThetanutsQuotes } from '@/lib/api/quotes'
import { TradeAttachmentCard } from './TradeAttachmentCard'

// Import coin icons
import btcIcon from '@/assets/icon/bitcoin.png'
import ethIcon from '@/assets/icon/ethereum.png'
import solIcon from '@/assets/icon/solana.png'
import bnbIcon from '@/assets/icon/binance.png'
import xrpIcon from '@/assets/icon/xrp.png'

const coinIcons: Record<string, typeof btcIcon> = {
  BTC: btcIcon,
  ETH: ethIcon,
  SOL: solIcon,
  BNB: bnbIcon,
  XRP: xrpIcon,
}

const ASSETS = ['ALL', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP']
const TYPES = ['ALL', 'CALL', 'PUT'] as const

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated: () => void
  availableTrade?: Option
}

export function CreatePostModal({ isOpen, onClose, onPostCreated, availableTrade }: CreatePostModalProps) {
  const { address } = useAccount()
  const [content, setContent] = useState('')
  const [attachedTrade, setAttachedTrade] = useState<AttachedTrade | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTradePicker, setShowTradePicker] = useState(false)
  
  // Filters for trade picker
  const [assetFilter, setAssetFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CALL' | 'PUT'>('ALL')

  // Fetch available trades for the picker
  const { data: availableTrades = [], isLoading: isLoadingTrades } = useQuery({
    queryKey: ['thetanuts-quotes-for-feed'],
    queryFn: fetchThetanutsQuotes,
    enabled: isOpen && showTradePicker,
    staleTime: 30000,
  })

  // Filter trades based on selected filters
  const filteredTrades = useMemo(() => {
    return availableTrades.filter(trade => {
      const matchesAsset = assetFilter === 'ALL' || trade.asset === assetFilter
      const matchesType = typeFilter === 'ALL' || trade.type === typeFilter
      return matchesAsset && matchesType
    })
  }, [availableTrades, assetFilter, typeFilter])

  if (!isOpen) return null

  const handleSelectTrade = (option: Option) => {
    setAttachedTrade({
      asset: option.asset,
      type: option.type,
      strike: option.strike,
      expiry: option.expiry,
      expiryTimestamp: option.expiryTimestamp,
      premium: option.premium,
      currentPrice: option.currentPrice,
    })
    setShowTradePicker(false)
  }

  const handleAttachPreselected = () => {
    if (availableTrade) {
      setAttachedTrade({
        asset: availableTrade.asset,
        type: availableTrade.type,
        strike: availableTrade.strike,
        expiry: availableTrade.expiry,
        expiryTimestamp: availableTrade.expiryTimestamp,
        premium: availableTrade.premium,
        currentPrice: availableTrade.currentPrice,
      })
    }
  }

  const handleRemoveTrade = () => {
    setAttachedTrade(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !content.trim() || isSubmitting) return

    const trimmedContent = content.trim()
    if (trimmedContent.length > 500) {
      setError('Post must be 500 characters or less')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await createPost(trimmedContent, address, attachedTrade || undefined)
      setContent('')
      setAttachedTrade(null)
      onPostCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'linear-gradient(180deg, rgba(38,38,38,0.95) 0%, rgba(26,26,26,0.98) 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Text Area */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind about options trading?"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <div className={`text-xs mt-1 text-right ${content.length > 500 ? 'text-red-400' : 'text-gray-500'}`}>
              {content.length}/500
            </div>
          </div>

          {/* Attached Trade */}
          {attachedTrade && (
            <div className="relative">
              <TradeAttachmentCard trade={attachedTrade} />
              <button
                type="button"
                onClick={handleRemoveTrade}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Actions Bar */}
          {!attachedTrade && (
            <div className="space-y-2">
              {/* Attach Trade Button */}
              <button
                type="button"
                onClick={() => setShowTradePicker(!showTradePicker)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Attach Trade Card
                </div>
                {showTradePicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Trade Picker */}
              {showTradePicker && (
                <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {/* Filters */}
                  <div className="p-3 border-b border-white/10 space-y-2">
                    {/* Asset Filter */}
                    <div className="flex gap-1 flex-wrap">
                      {ASSETS.map(asset => (
                        <button
                          key={asset}
                          type="button"
                          onClick={() => setAssetFilter(asset)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            assetFilter === asset
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {asset}
                        </button>
                      ))}
                    </div>
                    {/* Type Filter */}
                    <div className="flex gap-1">
                      {TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTypeFilter(type)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            typeFilter === type
                              ? type === 'CALL' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : type === 'PUT'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {filteredTrades.length} trades found
                    </p>
                  </div>

                  {/* Trade List */}
                  <div className="max-h-48 overflow-y-auto">
                    {isLoadingTrades ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Loading trades...
                      </div>
                    ) : filteredTrades.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No trades match filters
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {filteredTrades.slice(0, 20).map((option, index) => (
                          <button
                            key={`${option.asset}-${option.type}-${option.strike}-${index}`}
                            type="button"
                            onClick={() => handleSelectTrade(option)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                              {coinIcons[option.asset] ? (
                                <Image 
                                  src={coinIcons[option.asset]} 
                                  alt={option.asset} 
                                  width={24} 
                                  height={24}
                                  className="object-contain"
                                />
                              ) : (
                                <span className="text-[10px] text-gray-400">{option.asset}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">{option.asset}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  option.type === 'CALL' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {option.type}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Strike: ${option.strike.toLocaleString()} • {option.expiry}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick attach if pre-selected */}
              {availableTrade && (
                <button
                  type="button"
                  onClick={handleAttachPreselected}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Attach Current: {availableTrade.asset} {availableTrade.type}
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!content.trim() || !address || isSubmitting}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: 'linear-gradient(to bottom, #ffd48d, #b78751)',
              color: '#1a1a1a'
            }}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>

          {!address && (
            <p className="text-center text-gray-500 text-xs">
              Connect your wallet to post
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
