'use client'

import React from 'react'
import Image from 'next/image'
import { formatUnits } from 'viem'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Option } from '@/types'
import { getStructureType, getStrikeWidth, getBreakEven } from '@/lib/api/payouts'
import { STRIKE_DECIMALS } from '@/lib/constants'
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

function strikeValue(s: bigint | number | string): number {
  return parseFloat(formatUnits(BigInt(s), STRIKE_DECIMALS))
}

const fmt = (n: number, max = 2) =>
  n.toLocaleString('en-US', { maximumFractionDigits: max })

const PAGE_SIZE = 12

interface AdvancedOptionsTableProps {
  options: Option[]
  selected: Option | null
  onSelect: (option: Option) => void
}

export default function AdvancedOptionsTable({
  options,
  selected,
  onSelect,
}: AdvancedOptionsTableProps) {
  const [page, setPage] = React.useState(0)
  const pageCount = Math.max(1, Math.ceil(options.length / PAGE_SIZE))

  // Reset page when options change
  React.useEffect(() => {
    setPage(0)
  }, [options.length])

  if (options.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(26,26,26,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">
          No Options Found
        </h2>
        <p className="text-xs text-gray-500">
          Try adjusting your asset, type, or structure filters.
        </p>
      </div>
    )
  }

  const start = page * PAGE_SIZE
  const pageOptions = options.slice(start, start + PAGE_SIZE)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(20,20,20,0.95)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[720px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-gray-500 text-[10px] uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Strike</th>
              <th className="px-4 py-3 font-medium text-right">Spot</th>
              <th className="px-4 py-3 font-medium text-right">Premium</th>
              <th className="px-4 py-3 font-medium text-right">Payout Ratio</th>
              <th className="px-4 py-3 font-medium text-right">Break-Even</th>
              <th className="px-4 py-3 font-medium text-right">Delta</th>
              <th className="px-4 py-3 font-medium text-right">IV</th>
              <th className="px-4 py-3 font-medium text-right">Expiry</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pageOptions.map((option) => {
              const strikes = option.raw.order.strikes.map(strikeValue)
              const isCall = option.type === 'CALL'
              const isSelected =
                selected?.raw.signature === option.raw.signature &&
                selected?.raw.optionBookAddress === option.raw.optionBookAddress

              const structure = getStructureType(strikes.length)
              const strikeText =
                strikes.length > 1
                  ? `${fmt(strikes[0])} → ${fmt(strikes[strikes.length - 1])}`
                  : fmt(strikes[0])

              // Payout ratio = max profit per $1 invested
              const strikeWidth =
                strikes.length > 1
                  ? getStrikeWidth(option.raw.order.strikes)
                  : 0
              const payoutRatio =
                strikes.length > 1 && option.pricePerContract > 0
                  ? strikeWidth / option.pricePerContract
                  : option.pricePerContract > 0
                    ? option.apy
                    : 0

              const breakEven = getBreakEven(
                option.raw.order.strikes,
                isCall,
                option.pricePerContract,
                option.currentPrice
              )

              const greeks = option.raw.greeks

              return (
                <tr
                  key={`${option.raw.optionBookAddress}-${option.raw.signature}`}
                  onClick={() => onSelect(option)}
                  className={`border-b border-white/[0.04] cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-white/[0.06]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {coinIcons[option.asset] ? (
                        <Image
                          src={coinIcons[option.asset]}
                          alt={option.asset}
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          {option.asset}
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-[11px]">
                          {option.asset}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[9px] font-bold uppercase ${
                              isCall ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {option.type}
                          </span>
                          <span className="text-[9px] text-gray-600">
                            {structure}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-medium text-[11px]">
                    ${strikeText}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-[11px]">
                    ${fmt(option.currentPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium text-[11px]">
                    ${fmt(option.pricePerContract, 4)}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400 font-semibold text-[11px]">
                    {payoutRatio >= 1000 || payoutRatio === Infinity
                      ? '∞'
                      : fmt(payoutRatio, 1) + 'x'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-[11px]">
                    ${fmt(breakEven)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-[11px]">
                    {greeks ? greeks.delta.toFixed(3) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 text-[11px]">
                    {greeks ? fmt(greeks.iv * 100, 1) + '%' : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-[11px] whitespace-nowrap">
                    {option.expiry}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                        isSelected
                          ? isCall
                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                            : 'bg-red-500/20 text-red-400 border border-red-500/20'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Trade <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.06]">
        <span className="text-[10px] text-gray-500">
          {start + 1}–{Math.min(start + PAGE_SIZE, options.length)} of{' '}
          {options.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="text-[10px] text-gray-500 px-1">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
