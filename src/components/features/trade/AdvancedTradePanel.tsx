'use client'

import React, { useState, useMemo, useId } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
} from 'lucide-react'
import type { Option } from '@/types'
import {
  getBreakEven,
  getStrikeWidth,
  getStructureType,
  payoutAtPrice,
} from '@/lib/api/payouts'
import { formatUnits } from 'viem'
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

const fmt = (n: number, digits = 2) =>
  n.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })

const fmtUSD = (n: number) => {
  const rounded = Math.floor(n * 1e6) / 1e6
  if (rounded === 0) return '$0'
  return `$${rounded.toFixed(6).replace(/\.?0+$/, '')}`
}

function settlementRows(option: Option, investment: number) {
  const strikes = option.raw.order.strikes.map(strikeValue)
  const isCall = option.type === 'CALL'
  const numContracts = investment / option.pricePerContract

  // Generate scenarios around strikes and current price
  const prices = new Set<number>()
  prices.add(option.currentPrice * 0.9)
  prices.add(option.currentPrice * 0.95)
  prices.add(option.currentPrice)
  prices.add(option.currentPrice * 1.05)
  prices.add(option.currentPrice * 1.1)
  strikes.forEach((s) => {
    prices.add(s * 0.98)
    prices.add(s)
    prices.add(s * 1.02)
  })

  const sorted = Array.from(prices).sort((a, b) => a - b)

  return sorted.map((price) => {
    const payout = payoutAtPrice(
      option.raw.order.strikes,
      isCall,
      numContracts,
      price
    )
    const pnl = payout - investment
    const pnlPct = investment > 0 ? (pnl / investment) * 100 : 0
    return {
      price,
      payout,
      pnl,
      pnlPct,
      highlight: Math.abs(price - option.currentPrice) < option.currentPrice * 0.01,
    }
  })
}

/**
 * PnL-at-expiry curve. Hand-rolled SVG so no chart dependency is needed.
 * X = expiry price, Y = net PnL in USD for the chosen investment.
 */
function PayoffChart({ option, investment }: { option: Option; investment: number }) {
  const gradientId = useId().replace(/:/g, '')
  const strikes = option.raw.order.strikes.map(strikeValue)
  const isCall = option.type === 'CALL'
  const numContracts =
    option.pricePerContract > 0 ? investment / option.pricePerContract : 0

  const anchors = [option.currentPrice, ...strikes]
  const lo = Math.min(...anchors) * 0.75
  const hi = Math.max(...anchors) * 1.25
  const steps = 80

  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const price = lo + ((hi - lo) * i) / steps
    const pnl =
      payoutAtPrice(option.raw.order.strikes, isCall, numContracts, price) -
      investment
    return { price, pnl }
  })

  const pnls = pts.map((p) => p.pnl)
  const top = Math.max(...pnls, 0)
  const bottom = Math.min(...pnls, 0)
  const span = top - bottom || 1

  const W = 480
  const H = 190
  const padL = 8
  const padR = 8
  const padT = 20
  const padB = 22
  const x = (price: number) =>
    padL + ((price - lo) / (hi - lo)) * (W - padL - padR)
  const y = (pnl: number) =>
    padT + (1 - (pnl - bottom) / span) * (H - padT - padB)
  const zero = y(0)
  const breakEven = getBreakEven(
    option.raw.order.strikes,
    isCall,
    option.pricePerContract,
    option.currentPrice
  )
  const spotX = x(option.currentPrice)

  const line = pts
    .map((p, i) => `${i ? 'L' : 'M'}${x(p.price).toFixed(1)} ${y(p.pnl).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(hi).toFixed(1)} ${zero.toFixed(
    1
  )} L${x(lo).toFixed(1)} ${zero.toFixed(1)} Z`
  const clamp = (v: number) => Math.max(padL, Math.min(W - padR, v))

  return (
    <div
      className="rounded-xl border border-white/10 p-3"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-500">
          Payoff at expiry
        </span>
        <span className="text-[10px] text-gray-500">
          Spot{' '}
          <span className="text-white font-semibold">
            ${fmt(option.currentPrice)}
          </span>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Profit and loss at expiry"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* zero PnL line */}
        <line
          x1={padL}
          y1={zero}
          x2={W - padR}
          y2={zero}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#fbbf24" strokeWidth="2" />
        {/* spot marker */}
        <line
          x1={spotX}
          y1={padT}
          x2={spotX}
          y2={H - padB}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* break-even marker */}
        <circle cx={clamp(x(breakEven))} cy={zero} r="3" fill="#22c55e" />
        <text x={spotX} y={padT - 6} fill="#e5e7eb" fontSize="9" textAnchor="middle">
          Spot
        </text>
        <text x={padL} y={H - 6} fill="#9ca3af" fontSize="9">
          ${fmt(lo)}
        </text>
        <text x={W - padR} y={H - 6} fill="#9ca3af" fontSize="9" textAnchor="end">
          ${fmt(hi)}
        </text>
      </svg>
      <div className="flex items-center justify-between mt-1 text-[10px]">
        <span className="text-gray-500">
          Break-even{' '}
          <span className="text-green-400 font-semibold">${fmt(breakEven)}</span>
        </span>
        <span className={top > 0 ? 'text-green-400' : 'text-gray-500'}>
          {top > 0 ? `Max +$${fmt(top)}` : 'No upside'}
        </span>
      </div>
    </div>
  )
}

interface AdvancedTradePanelProps {
  option: Option
  onTrade: (amount: string) => void
  onClose: () => void
  isPending: boolean
  isConfirming: boolean
  exactApproval: boolean
  onToggleApproval: () => void
}

export default function AdvancedTradePanel({
  option,
  onTrade,
  onClose,
  isPending,
  isConfirming,
  exactApproval,
  onToggleApproval,
}: AdvancedTradePanelProps) {
  const [amount, setAmount] = useState<string>(() => {
    const raw = Math.min(10, option.premium)
    return (Math.floor(raw * 1e6) / 1e6).toString()
  })

  const investment = parseFloat(amount) || 0
  const numContracts =
    option.pricePerContract > 0 ? investment / option.pricePerContract : 0

  const breakEven = getBreakEven(
    option.raw.order.strikes,
    option.type === 'CALL',
    option.pricePerContract,
    option.currentPrice
  )

  const strikeWidth =
    option.raw.order.strikes.length > 1
      ? getStrikeWidth(option.raw.order.strikes)
      : 0

  const payoutRatio = useMemo(() => {
    if (option.pricePerContract <= 0) return 0
    if (option.raw.order.strikes.length > 1) {
      return strikeWidth / option.pricePerContract
    }
    // Vanilla: approximate leverage at 5% move
    return (option.currentPrice * 0.05) / option.pricePerContract
  }, [option, strikeWidth])

  const leverage = option.raw.order.strikes.length > 1 ? payoutRatio : option.apy

  const maxLoss = investment
  const maxProfit =
    option.raw.order.strikes.length > 1
      ? strikeWidth * numContracts
      : Infinity

  const rows = useMemo(
    () => settlementRows(option, investment),
    [option, investment]
  )

  const isCall = option.type === 'CALL'
  const structure = getStructureType(option.raw.order.strikes.length)
  const strikes = option.raw.order.strikes.map(strikeValue)
  const greeks = option.raw.greeks

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(20,20,20,0.95)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {coinIcons[option.asset] ? (
            <Image
              src={coinIcons[option.asset]}
              alt={option.asset}
              width={28}
              height={28}
              className="object-contain"
            />
          ) : null}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{option.asset}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  isCall
                    ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}
              >
                {option.type}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                {structure}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {strikes.length > 1
                ? `Strikes: ${strikes.map((s) => '$' + fmt(s)).join(' → ')}`
                : `Strike: $${fmt(strikes[0])}`}
              <span className="ml-2 text-gray-300">
                Spot ${fmt(option.currentPrice)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          Close
        </button>
      </div>

      <div className="p-4 grid gap-4 md:grid-cols-2">
        {/* Left: inputs & quick stats */}
        <div className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block">
              How much USDC do you want to trade?
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 focus-within:border-amber-500/50 transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <DollarSign className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setAmount(val)
                  }
                }}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0) {
                    setAmount((Math.floor(val * 1e6) / 1e6).toString())
                  }
                }}
                className="flex-1 bg-transparent text-white font-semibold outline-none text-sm"
                placeholder="0.00"
              />
              <span className="text-[10px] text-gray-500">USDC</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-gray-500">
                Available: {fmtUSD(option.premium)}
              </span>
              {investment > option.premium && (
                <span className="text-[10px] text-red-400">
                  Exceeds available
                </span>
              )}
              {investment <= 0 && amount !== '' && (
                <span className="text-[10px] text-red-400">
                  Amount must be greater than 0
                </span>
              )}
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Position Size
              </div>
              <div className="text-sm font-semibold text-white">
                {fmt(numContracts, 4)} Contracts
              </div>
            </div>
            <div className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Leverage
              </div>
              <div className="text-sm font-semibold text-white">
                {leverage >= 1000 || leverage === Infinity
                  ? '∞'
                  : fmt(leverage, 1) + 'x'}
              </div>
            </div>
            <div className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Break-Even
              </div>
              <div className="text-sm font-semibold text-white">
                ${fmt(breakEven)}
              </div>
            </div>
            <div className="rounded-lg p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Expiry
              </div>
              <div className="text-sm font-semibold text-white">{option.expiry}</div>
            </div>
          </div>

          {/* Payoff asymmetry */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 border border-red-500/10" style={{ background: 'rgba(239,68,68,0.05)' }}>
              <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">
                Max Loss
              </div>
              <div className="text-sm font-bold text-red-400">
                -{fmtUSD(maxLoss)}
              </div>
              <div className="text-[10px] text-red-400/60">100% of investment</div>
            </div>
            <div className="rounded-lg p-3 border border-green-500/10" style={{ background: 'rgba(34,197,94,0.05)' }}>
              <div className="text-[10px] uppercase tracking-wider text-green-400 mb-1">
                Potential Profit
              </div>
              <div className="text-sm font-bold text-green-400">
                {maxProfit === Infinity
                  ? 'Unbounded'
                  : '+' + fmtUSD(maxProfit)}
              </div>
              <div className="text-[10px] text-green-400/60">
                {maxProfit === Infinity
                  ? 'No cap on upside'
                  : `${fmt((maxProfit / investment) * 100, 0)}% return`}
              </div>
            </div>
          </div>

          {/* Risk warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/10" style={{ background: 'rgba(245,158,11,0.05)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-400/80 leading-relaxed">
              Options trading involves risk. You can lose your entire investment
              if the market moves against you.
            </p>
          </div>

          {/* Approval toggle */}
          <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/[0.02] transition-colors border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <input
              type="checkbox"
              checked={exactApproval}
              onChange={onToggleApproval}
              className="w-4 h-4 accent-amber-500 mt-0.5"
            />
            <div>
              <span className="text-xs text-gray-200 font-medium">
                Approve single trade only
              </span>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {exactApproval
                  ? 'Only the exact premium is approved. You may need to approve again for future trades.'
                  : 'Up to $1000 is approved to avoid an approval transaction on every trade.'}
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onTrade(amount)}
              disabled={
                isPending ||
                isConfirming ||
                investment <= 0 ||
                investment > option.premium
              }
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                isCall
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
              }`}
            >
              {isPending || isConfirming
                ? 'Processing...'
                : `Trade ${option.type}`}
            </button>
          </div>
        </div>

        {/* Right: payoff chart + settlement scenarios */}
        <div>
          <PayoffChart option={option} investment={investment} />

          <h4 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 mt-4">
            Settlement Scenarios
          </h4>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Expiry Price</th>
                  <th className="px-3 py-2 font-medium text-right">Return</th>
                  <th className="px-3 py-2 font-medium text-right">PnL %</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/5 ${
                      row.highlight ? 'bg-white/[0.03]' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-white font-medium">
                      ${fmt(row.price)}
                      {row.highlight && (
                        <span className="ml-1 text-[9px] text-amber-400">
                          (current)
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        row.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {row.pnl >= 0 ? '+' : ''}
                      {fmtUSD(row.pnl)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        row.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {row.pnlPct >= 0 ? '+' : ''}
                      {fmt(row.pnlPct, 1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Greeks mini table */}
          {greeks && (
            <div className="mt-3 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase tracking-wide">
                    <th className="px-3 py-2 font-medium">Delta</th>
                    <th className="px-3 py-2 font-medium text-right">IV</th>
                    <th className="px-3 py-2 font-medium text-right">Gamma</th>
                    <th className="px-3 py-2 font-medium text-right">Theta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 text-white font-medium">
                      {greeks.delta.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right text-white font-medium">
                      {(greeks.iv * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right text-white font-medium">
                      {greeks.gamma.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-right text-white font-medium">
                      {greeks.theta.toFixed(4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
