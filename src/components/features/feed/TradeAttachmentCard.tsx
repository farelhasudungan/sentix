'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { AttachedTrade } from '@/types'

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

interface TradeAttachmentCardProps {
  trade: AttachedTrade
}

export function TradeAttachmentCard({ trade }: TradeAttachmentCardProps) {
  // Use stable filters instead of ephemeral signature
  const tradeLink = `/trade?filter=${trade.asset}&type=${trade.type}&strike=${trade.strike}`

  return (
    <Link href={tradeLink}>
      <div 
        className={`rounded-xl p-3 border transition-all hover:scale-[1.02] cursor-pointer ${
          trade.type === 'CALL' 
            ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
            : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Asset Icon */}
          <div className="w-10 h-10 flex items-center justify-center rounded-lg p-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {coinIcons[trade.asset] ? (
              <Image 
                src={coinIcons[trade.asset]} 
                alt={trade.asset} 
                width={32} 
                height={32}
                className="object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">{trade.asset}</span>
            )}
          </div>

          {/* Trade Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{trade.asset}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                trade.type === 'CALL' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {trade.type}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Strike: ${trade.strike.toLocaleString()} • {trade.expiry}
            </div>
          </div>

          {/* Arrow */}
          <div className="text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
