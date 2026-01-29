'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Clock, DollarSign, TrendingUp, Activity, AlertTriangle, X, ArrowUp, ArrowDown, ExternalLink, CheckCircle } from 'lucide-react'

// Import coin icons
import btcIcon from '@/assets/icon/bitcoin.png'
import ethIcon from '@/assets/icon/ethereum.png'
import solIcon from '@/assets/icon/solana.png'
import bnbIcon from '@/assets/icon/binance.png'
import xrpIcon from '@/assets/icon/xrp.png'

import { useQuery } from '@tanstack/react-query'
import { fetchThetanutsQuotes } from '@/lib/api/quotes'
import { useThetanutsTrade } from '@/hooks/useThetanutsTrade'
import { formatUnits } from 'viem'
import { getStrikeWidth, calculateMaxPayout, getStructureType, payoutAtPrice, getOptimalProfitPrice } from '@/lib/api/payouts'
import { STRIKE_DECIMALS } from '@/lib/constants'
import { FilterBar } from '@/components/ui/FilterBar'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { OptionTypeModal } from '@/components/ui/OptionTypeModal'
import { ProfitDetailModal } from '@/components/ui/ProfitDetailModal'
import { SwipeButtons } from '@/components/features/trade/SwipeButtons'
import { TutorialModal } from '@/components/features/trade/TutorialModal'
import { useNotifications } from '@/context/NotificationContext'
import type { Option } from '@/types'

const coins = ['ALL', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP']

const coinIcons: Record<string, typeof btcIcon> = {
  BTC: btcIcon,
  ETH: ethIcon,
  SOL: solIcon,
  BNB: bnbIcon,
  XRP: xrpIcon,
}

// Wrapper component with Suspense for useSearchParams
export default function TradePage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-400 py-12">Loading...</div>}>
      <TradeContent />
    </Suspense>
  )
}

function TradeContent() {
  const searchParams = useSearchParams()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [positions, setPositions] = useState<Option[]>([])
  const [filter, setFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CALL' | 'PUT'>('ALL')
  
  // Track if we've already applied URL params
  const appliedParamsRef = React.useRef<string | null>(null)

  // Fetch live data
  const { data: optionsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['thetanuts-quotes'],
    queryFn: fetchThetanutsQuotes,
    refetchInterval: 30000,
  })

  // Get params from URL (from feed trade cards or direct links)
  const urlFilter = searchParams.get('filter')
  const urlType = searchParams.get('type') as 'CALL' | 'PUT' | null
  const urlStrike = searchParams.get('strike')
  const signature = searchParams.get('signature')
  const paramsKey = `${urlFilter}-${urlType}-${urlStrike}-${signature}`

  // Derived state for filtered options (now includes type filter)
  const filteredOptions = optionsData.filter((option) => {
    const matchesAsset = filter === 'ALL' || option.asset === filter
    const matchesType = typeFilter === 'ALL' || option.type === typeFilter
    return matchesAsset && matchesType
  })

  const currentOption = filteredOptions[currentIndex]

  // Auto-apply filters from URL params (from feed trade cards)
  useEffect(() => {
    if (optionsData.length === 0 || appliedParamsRef.current === paramsKey) {
      return
    }

    // Handle filter and type params from feed trade cards
    if (urlFilter && urlFilter !== 'ALL') {
      setFilter(urlFilter)
    }
    if (urlType && (urlType === 'CALL' || urlType === 'PUT')) {
      setTypeFilter(urlType)
    }

    // If strike is provided, try to find and navigate to that specific trade
    if (urlFilter && urlType && urlStrike) {
      const strikeNum = parseFloat(urlStrike)
      const matchingOptions = optionsData.filter(
        opt => opt.asset === urlFilter && opt.type === urlType
      )
      const targetIndex = matchingOptions.findIndex(opt => opt.strike === strikeNum)
      if (targetIndex >= 0) {
        setCurrentIndex(targetIndex)
      }
    }

    // Handle legacy signature param
    if (signature) {
      const targetOption = optionsData.find(opt => opt.raw.signature === signature)
      if (targetOption) {
        setFilter(targetOption.asset)
        setTypeFilter(targetOption.type)
        const matchingOptions = optionsData.filter(
          opt => opt.asset === targetOption.asset && opt.type === targetOption.type
        )
        const targetIndex = matchingOptions.findIndex(opt => opt.raw.signature === signature)
        if (targetIndex >= 0) {
          setCurrentIndex(targetIndex)
        }
      }
    }

    // Reset index when filters change from URL (only if no specific target)
    if ((urlFilter || urlType) && !signature && !urlStrike) {
      setCurrentIndex(0)
    }

    appliedParamsRef.current = paramsKey
  }, [paramsKey, optionsData, urlFilter, urlType, urlStrike, signature])

  const { executeTrade, isPending, isConfirming } = useThetanutsTrade()
  const { addNotification } = useNotifications()

  // Investment amount state - will be set based on available premium
  const [investmentAmount, setInvestmentAmount] = useState<string>('')
  
  // Modal states
  const [showTutorial, setShowTutorial] = useState(false)
  
  // Check persisted tutorial state on mount
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('optixel_tutorial_seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  const [isOptionTypeModalOpen, setIsOptionTypeModalOpen] = useState(false)
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false)
  const [showTradeConfirm, setShowTradeConfirm] = useState(false)
  const [pendingTradeOption, setPendingTradeOption] = useState<Option | null>(null)
  
  // Success notification state
  const [successNotification, setSuccessNotification] = useState<{
    show: boolean
    hash: string
    asset: string
    type: string
  } | null>(null)

  // Set smart default investment amount when currentOption changes
  useEffect(() => {
    if (currentOption) {
      // Default to min of $10 or available premium, rounded down to USDC precision
      const rawDefault = Math.min(10, currentOption.premium);
      const smartDefault = (Math.floor(rawDefault * 1e6) / 1e6).toString();
      setInvestmentAmount(smartDefault)
    }
  }, [currentOption?.raw.signature])

  // Format currency
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // Format USDC with 6 decimal precision 
  const formatUSDC = (value: number) => {
    const rounded = Math.floor(value * 1e6) / 1e6
    if (rounded === Math.floor(rounded)) {
      return `$${rounded.toFixed(0)}`
    }
    // Remove trailing zeros
    return `$${rounded.toFixed(6).replace(/\.?0+$/, '')}`
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    const optionToTrade = filteredOptions[currentIndex];
    if (!optionToTrade) return

    if (direction === 'right') {
      // Show confirmation modal before trading
      setPendingTradeOption(optionToTrade)
      setShowTradeConfirm(true)
      return
    }

    // Left swipe - just skip
    setSwipeDirection(direction)
    setTimeout(() => {
      setSwipeDirection(null)
      if (currentIndex < filteredOptions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setCurrentIndex(0)
      }
    }, 300)
  }

  const handleConfirmTrade = async () => {
    if (!pendingTradeOption) return
    
    setShowTradeConfirm(false)
    setSwipeDirection('right')
    
    const { data: freshOptions } = await refetch()
    const freshOption = freshOptions?.find(
      (opt) => opt.raw.signature === pendingTradeOption.raw.signature && 
               opt.raw.optionBookAddress === pendingTradeOption.raw.optionBookAddress
    ) || pendingTradeOption
    
    console.log('Trading option:', freshOption.asset, freshOption.type, freshOption.strike);
    
    const result = await executeTrade(freshOption, investmentAmount)
    if (result && result.status === 'connecting_wallet') {
      setSwipeDirection(null)
      setPendingTradeOption(null)
      return
    }

    // Show success notification with transaction hash
    if (result && result.status === 'success' && result.hash) {
      setSuccessNotification({
        show: true,
        hash: result.hash,
        asset: freshOption.asset,
        type: freshOption.type
      })
      // Auto-hide after 8 seconds
      setTimeout(() => setSuccessNotification(null), 8000)
      
      // Save to notification history
      addNotification({
        type: 'trade_success',
        title: 'Trade Successful!',
        message: `${freshOption.asset} ${freshOption.type} position opened`,
        tx_hash: result.hash
      })
    }

    setPositions([...positions, freshOption])
    setPendingTradeOption(null)
    
    setTimeout(() => {
      setSwipeDirection(null)
      if (currentIndex < filteredOptions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setCurrentIndex(0)
      }
    }, 300)
  }

  const handleCancelTrade = () => {
    setShowTradeConfirm(false)
    setPendingTradeOption(null)
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Your fortune awaits</h1>
        {isLoading && <p className="text-xs text-yellow-400 animate-pulse">Scanning chain...</p>}
        {error && <p className="text-xs text-red-400">Error fetching data</p>}
      </div>

      {/* Filter Bar */}
      <FilterBar 
        options={coins} 
        selected={filter} 
        onSelect={(newFilter) => {
          setFilter(newFilter);
          setCurrentIndex(0);
        }} 
      />

      {/* Type Filter */}
      <div className="flex justify-center gap-2 mb-4">
        {(['ALL', 'CALL', 'PUT'] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setTypeFilter(type);
              setCurrentIndex(0);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

      {/* Swipe Card */}
      {currentOption ? (
        <>
          {/* Current Price */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400 text-sm">Current Price:</span>
            <span className="font-bold text-lg text-white">{formatMoney(currentOption.currentPrice)}</span>
          </div>

          <div 
            className={`relative border rounded-2xl p-6 transition-all duration-300 ${
              swipeDirection === 'left' 
                ? 'transform -translate-x-full opacity-0 border-red-500' 
                : swipeDirection === 'right' 
                  ? 'transform translate-x-full opacity-0 border-green-500' 
                  : currentOption.type === 'CALL' 
                    ? 'border-green-500/30' 
                    : 'border-red-500/30'
            }`}
            style={{ background: 'rgba(26,26,26,0.8)', borderColor: currentOption.type === 'CALL' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}
          >
            {/* Asset Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {coinIcons[currentOption.asset] ? (
                    <Image 
                      src={coinIcons[currentOption.asset]} 
                      alt={currentOption.asset} 
                      width={48} 
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">{currentOption.asset}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentOption.asset}</h2>
                </div>
              </div>
              {/* CALL/PUT Badge */}
              <div className={`px-4 py-2 rounded-lg font-semibold ${
                currentOption.type === 'CALL'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <span className="text-sm">{currentOption.type}</span>
              </div>
            </div>

            {/* Stats Layout */}
            <div className="space-y-4 mb-6">
              {/* Strike Price(s) */}
              {(() => {
                const strikes = currentOption.raw.order.strikes;
                const formattedStrikes = strikes.map(s => 
                  parseFloat(formatUnits(BigInt(s), STRIKE_DECIMALS)).toLocaleString()
                );
                const isMultiLeg = strikes.length > 1;
                
                return (
                  <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
                      {isMultiLeg ? `Strike Prices (${getStructureType(strikes.length)})` : 'Strike Price'}
                    </div>
                    {isMultiLeg ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {formattedStrikes.map((strike, i) => (
                          <span key={i} className="inline-flex items-center">
                            <span className="text-xl font-bold text-white">${strike}</span>
                            {i < formattedStrikes.length - 1 && (
                              <span className="text-gray-500 mx-2">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-white">${currentOption.strike.toLocaleString()}</div>
                    )}
                  </div>
                );
              })()}

              {/* Expiry & APY */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-gray-400 text-xs mb-1 flex items-center justify-center gap-1 uppercase">
                    <Clock className="w-3 h-3" /> Expiry
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {currentOption.expiry} <CountdownTimer expiryTimestamp={currentOption.expiryTimestamp} />
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                  <div className="text-green-400 text-xs mb-1 flex items-center justify-center gap-1 uppercase">
                    <TrendingUp className="w-3 h-3" /> Leverage
                  </div>
                  <div className="text-lg font-bold text-green-400">{currentOption.apy}x</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                <div className="text-yellow-400 text-xs mb-1 uppercase tracking-wide flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3" /> Available Premium
                </div>
                <div className="text-2xl font-bold text-yellow-400">{currentOption.premium.toFixed(6)} USD</div>
              </div>

              {/* Investment Input */}
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <label className="block text-gray-400 text-xs uppercase mb-2">I want to invest</label>
                 <div className="flex items-center justify-center gap-2">
                   <span className="text-xl text-white">$</span>
                   <input 
                     type="text" 
                     inputMode="decimal"
                     value={investmentAmount}
                     onChange={(e) => {
                       const val = e.target.value;
                       // Allow empty, numbers, and decimals while typing
                       if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                         setInvestmentAmount(val);
                       }
                     }}
                     onBlur={(e) => {
                       const val = parseFloat(e.target.value);
                       if (!isNaN(val) && val >= 0) {
                         // Round down to 6 decimal places on blur
                         const rounded = Math.floor(val * 1e6) / 1e6;
                         setInvestmentAmount(rounded.toString());
                       } else if (e.target.value === '') {
                         setInvestmentAmount('');
                       }
                     }}
                     className="text-xl font-bold w-28 text-center bg-transparent border-b-2 border-yellow-500/50 focus:outline-none focus:border-yellow-400 text-white"
                   />
                 </div>
                 {parseFloat(investmentAmount) <= 0 && investmentAmount !== '' && (
                    <div className="text-[10px] text-red-400 mt-1">Amount must be greater than 0</div>
                  )}
                  {parseFloat(investmentAmount) > currentOption.premium && (
                    <div className="text-[10px] text-yellow-400 mt-1">
                      ⚠️ Exceeds available ({currentOption.premium.toFixed(6)} USD max)
                    </div>
                  )}
                  <div className="text-[10px] text-gray-500 mt-1">
                    ≈ {((parseFloat(investmentAmount) || 0) / currentOption.pricePerContract).toFixed(6)} Contracts
                  </div>
              </div>

              {/* Option Type & Potential Profit */}
              {(() => {
                const numContracts = (parseFloat(investmentAmount) || 0) / currentOption.pricePerContract;
                const structureType = getStructureType(currentOption.raw.order.strikes.length);
                
                // Calculate optimal profit based on structure type
                const isCall = currentOption.type === 'CALL';
                const { price: optimalPrice, label: priceLabel } = getOptimalProfitPrice(
                  currentOption.raw.order.strikes,
                  isCall,
                  currentOption.currentPrice
                );
                
                // Calculate payout at optimal price using imported function
                const optimalPayout = payoutAtPrice(
                  currentOption.raw.order.strikes,
                  isCall,
                  numContracts,
                  optimalPrice
                );
                const potentialProfit = optimalPayout - (parseFloat(investmentAmount) || 0);
                
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsOptionTypeModalOpen(true)}
                      className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/50 transition-all group"
                    >
                      <div className="text-blue-400 text-xs mb-1 uppercase tracking-wide flex items-center justify-center gap-1">
                        Option Type
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {structureType}
                      </div>
                      <div className="text-[9px] text-blue-400/60">Tap to see</div>
                    </button>
                    <button
                      onClick={() => setIsProfitModalOpen(true)}
                      className={`border rounded-xl p-3 text-center cursor-pointer transition-all group ${potentialProfit >= 0 ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50' : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50'}`}
                    >
                      <div className={`text-xs mb-1 uppercase tracking-wide flex items-center justify-center gap-1 ${potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Potential Profit
                      </div>
                      <div className={`text-lg font-bold ${potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {potentialProfit >= 0 ? '+' : ''}{formatMoney(potentialProfit)}
                      </div>
                      <div className={`text-[9px] ${potentialProfit >= 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
                        Tap to see scenarios
                      </div>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Card Counter */}
            <div className="text-center text-gray-500 text-xs">
              {currentIndex + 1} / {filteredOptions.length}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(26,26,26,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-4xl mb-4">😴</div>
          <h2 className="text-lg font-bold text-gray-400 mb-2">NO CARDS FOUND</h2>
          <p className="text-sm text-gray-500">Try selecting a different asset filter.</p>
        </div>
      )}

      {/* Swipe Buttons */}
      {currentOption && (
        <SwipeButtons 
          onSwipeLeft={() => handleSwipe('left')}
          onSwipeRight={() => handleSwipe('right')}
          disabled={isPending || isConfirming || parseFloat(investmentAmount) > currentOption.premium || parseFloat(investmentAmount) <= 0}
        />
      )}

      {/* Option Type Modal */}
      {currentOption && (
        <OptionTypeModal
          isOpen={isOptionTypeModalOpen}
          onClose={() => setIsOptionTypeModalOpen(false)}
          option={currentOption}
          investmentAmount={parseFloat(investmentAmount) || 0}
        />
      )}

      {/* Profit Detail Modal */}
      {currentOption && (
        <ProfitDetailModal
          isOpen={isProfitModalOpen}
          onClose={() => setIsProfitModalOpen(false)}
          option={currentOption}
          investmentAmount={parseFloat(investmentAmount) || 0}
        />
      )}

      {/* Trade Confirmation Modal */}
      {showTradeConfirm && pendingTradeOption && (() => {
        const investment = parseFloat(investmentAmount) || 0
        const numContracts = investment / pendingTradeOption.pricePerContract
        const maxLoss = investment
        const isCall = pendingTradeOption.type === 'CALL'
        
        // Calculate optimal profit based on structure type
        const { price: optimalPrice, label: priceLabel } = getOptimalProfitPrice(
          pendingTradeOption.raw.order.strikes,
          isCall,
          pendingTradeOption.currentPrice
        );
        const optimalPayout = payoutAtPrice(
          pendingTradeOption.raw.order.strikes,
          isCall,
          numContracts,
          optimalPrice
        )
        const potentialProfit = optimalPayout - investment

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={handleCancelTrade}
          >
            <div 
              className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
              style={{ background: 'linear-gradient(180deg, rgba(38,38,38,0.98) 0%, rgba(26,26,26,0.99) 100%)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCall ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isCall ? <ArrowUp className="w-5 h-5 text-green-400" /> : <ArrowDown className="w-5 h-5 text-red-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Confirm Trade</h3>
                    <p className="text-xs text-gray-400">{pendingTradeOption.asset} {pendingTradeOption.type}</p>
                  </div>
                </div>
                <button
                  onClick={handleCancelTrade}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Trade Details */}
              <div className="p-4 space-y-3">
                {(() => {
                  const strikes = pendingTradeOption.raw.order.strikes;
                  const formattedStrikes = strikes.map(s => 
                    parseFloat(formatUnits(BigInt(s), STRIKE_DECIMALS)).toLocaleString()
                  );
                  const isMultiLeg = strikes.length > 1;
                  
                  return (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">
                        {isMultiLeg ? 'Strike Prices' : 'Strike Price'}
                      </span>
                      {isMultiLeg ? (
                        <span className="text-white font-medium">
                          {formattedStrikes.map((s, i) => (
                            <span key={i}>
                              ${s}{i < formattedStrikes.length - 1 ? ' → ' : ''}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-white font-medium">${pendingTradeOption.strike.toLocaleString()}</span>
                      )}
                    </div>
                  );
                })()}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Your Investment</span>
                  <span className="text-white font-medium">{formatUSDC(investment)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Expiry</span>
                  <span className="text-white font-medium">{pendingTradeOption.expiry}</span>
                </div>
              </div>

              {/* Payoff Asymmetry */}
              <div className="px-4 pb-4">
                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Payoff Asymmetry</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-[10px] uppercase mb-1">Max Loss</p>
                    <p className="text-red-400 font-bold text-lg">-{formatMoney(maxLoss)}</p>
                    <p className="text-red-400/60 text-[10px]">100% of investment</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-[10px] uppercase mb-1">Potential Profit</p>
                    <p className="text-green-400 font-bold text-lg">+{formatMoney(potentialProfit)}</p>
                    <p className="text-green-400/60 text-[10px]">{((potentialProfit / investment) * 100).toFixed(0)}% return</p>
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              <div className="px-4 pb-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 text-sm font-medium">Risk Warning</p>
                    <p className="text-amber-400/70 text-xs mt-1">
                      Options trading involves risk. You can lose your entire investment if the market moves against you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-4 pt-0">
                <button
                  onClick={handleCancelTrade}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmTrade}
                  disabled={isPending || isConfirming}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                    isCall 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  {isPending || isConfirming ? 'Processing...' : 'Confirm Trade'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Success Notification Toast */}
      {successNotification && (
        <div 
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <div 
            className="rounded-2xl p-4 border border-green-500/30 shadow-lg"
            style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.15) 0%, rgba(26,26,26,0.98) 100%)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-green-400 font-semibold text-sm">Trade Successful!</p>
                <p className="text-gray-400 text-xs mt-1">
                  {successNotification.asset} {successNotification.type} position opened
                </p>
                <a
                  href={`https://basescan.org/tx/${successNotification.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View on BaseScan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button
                onClick={() => setSuccessNotification(null)}
                className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

