'use client'

import React from 'react'
import { ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { SocialAnalysisPost } from '@/types'
import { formatRelativeTime } from '@/lib/api/feed'

interface SocialAnalysisCardProps {
  post: SocialAnalysisPost
}

export function SocialAnalysisCard({ post }: SocialAnalysisCardProps) {
  const getSentimentConfig = () => {
    switch (post.sentiment) {
      case 'bullish':
        return {
          icon: TrendingUp,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          label: 'Bullish',
          emoji: '🟢',
        }
      case 'bearish':
        return {
          icon: TrendingDown,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          label: 'Bearish',
          emoji: '🔴',
        }
      default:
        return {
          icon: Minus,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          label: 'Neutral',
          emoji: '⚪',
        }
    }
  }

  const sentimentConfig = getSentimentConfig()
  const SentimentIcon = sentimentConfig.icon

  // Build trade link if suggestion exists (just asset and type)
  const tradeLink = post.suggested_trade
    ? `/trade?asset=${post.suggested_trade.asset}&type=${post.suggested_trade.type}`
    : null

  return (
    <div
      className="rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-white/20"
      style={{ background: 'rgba(26,26,26,0.8)' }}
    >
      {/* Header: News Source */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* News Source Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            📰
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{post.account_display_name}</span>
              <span className="text-gray-500 text-sm">{post.account_username}</span>
            </div>
            <span className="text-gray-500 text-xs">{formatRelativeTime(post.posted_at)}</span>
          </div>
        </div>

        {/* Link to original article */}
        <a
          href={post.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
          title="Read full article"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Tweet Content */}
      <div className="px-4 py-3">
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Assets Mentioned */}
      {post.assets_mentioned.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {post.assets_mentioned.map((asset) => (
            <span
              key={asset}
              className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30"
            >
              {asset}
            </span>
          ))}
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-purple-400">AI Analysis</span>
        </div>

        {/* Sentiment Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${sentimentConfig.bgColor} border ${sentimentConfig.borderColor}`}>
            <SentimentIcon className={`w-4 h-4 ${sentimentConfig.color}`} />
            <span className={`text-sm font-medium ${sentimentConfig.color}`}>
              {sentimentConfig.label}
            </span>
            <span className="text-gray-400 text-xs">
              ({post.sentiment_confidence.toFixed(0)}% confidence)
            </span>
          </div>
        </div>

        {/* AI Summary */}
        <p className="text-gray-400 text-sm mb-3">
          💡 {post.ai_summary}
        </p>

        {/* Suggested Trade */}
        {post.suggested_trade && (
          <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold text-lg">{post.suggested_trade.asset}</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  post.suggested_trade.type === 'CALL' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {post.suggested_trade.type}
                </span>
              </div>

              {tradeLink && (
                <Link
                  href={tradeLink}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(to bottom, #ffd48d, #b78751)',
                    color: '#1a1a1a',
                  }}
                >
                  Trade
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
