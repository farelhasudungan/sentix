'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Clock, DollarSign, TrendingUp, Activity } from 'lucide-react'

// Import coin icons
import btcIcon from '@/assets/icon/bitcoin.png'
import ethIcon from '@/assets/icon/ethereum.png'
import solIcon from '@/assets/icon/solana.png'
import bnbIcon from '@/assets/icon/binance.png'
import xrpIcon from '@/assets/icon/xrp.png'

import { useQuery } from '@tanstack/react-query'
import { fetchThetanutsQuotes } from '@/lib/api/quotes'
import { useThetanutsTrade } from '@/hooks/useThetanutsTrade'
import { getStrikeWidth, calculateMaxPayout, getStructureType, payoutAtPrice } from '@/lib/api/payouts'
import { FilterBar } from '@/components/ui/FilterBar'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { OptionTypeModal } from '@/components/ui/OptionTypeModal'
import { ProfitDetailModal } from '@/components/ui/ProfitDetailModal'
import { SwipeButtons } from '@/components/features/trade/SwipeButtons'
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
  
  // Track the signature we've already navigated to
  const navigatedSignatureRef = React.useRef<string | null>(null)

  // Fetch live data
  const { data: optionsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['thetanuts-quotes'],
    queryFn: fetchThetanutsQuotes,
    refetchInterval: 30000,
  })

  // Get signature from URL
  const signature = searchParams.get('signature')

  // Derived state for filtered options
  const filteredOptions = optionsData.filter(
    (option) => filter === 'ALL' || option.asset === filter
  )

  const currentOption = filteredOptions[currentIndex]

  // Auto-navigate to specific trade when signature is in URL
  useEffect(() => {
    // Skip if no signature, no data, or we've already navigated to this signature
    if (!signature || optionsData.length === 0 || navigatedSignatureRef.current === signature) {
      return
    }

    // Find the option in all options
    const targetOption = optionsData.find(opt => opt.raw.signature === signature)
    if (targetOption) {
      // Set filter to the asset of the target option
      setFilter(targetOption.asset)
      
      // Find index in the filtered list (filter by asset)
      const filteredByAsset = optionsData.filter(opt => opt.asset === targetOption.asset)
      const targetIndex = filteredByAsset.findIndex(opt => opt.raw.signature === signature)
      
      if (targetIndex >= 0) {
        setCurrentIndex(targetIndex)
        // Mark this signature as navigated
        navigatedSignatureRef.current = signature
      }
    }
  }, [signature, optionsData])

  const { executeTrade, isPending, isConfirming } = useThetanutsTrade()

  // Investment amount state - will be set based on available premium
  const [investmentAmount, setInvestmentAmount] = useState<string>('')
  
  // Modal states
  const [isOptionTypeModalOpen, setIsOptionTypeModalOpen] = useState(false)
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false)

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

  const handleSwipe = async (direction: 'left' | 'right') => {
    // Capture the current option at swipe time from the current filtered list
    const optionToTrade = filteredOptions[currentIndex];
    if (!optionToTrade) return

    setSwipeDirection(direction)
    
    if (direction === 'right') {
      const { data: freshOptions } = await refetch()
      
      // Find the exact same order using signature (unique identifier)
      const freshOption = freshOptions?.find(
        (opt) => opt.raw.signature === optionToTrade.raw.signature && 
                 opt.raw.optionBookAddress === optionToTrade.raw.optionBookAddress
      ) || optionToTrade
      
      console.log('Trading option:', freshOption.asset, freshOption.type, freshOption.strike);
      
      const result = await executeTrade(freshOption, investmentAmount)
      if (result && result.status === 'connecting_wallet') {
        setSwipeDirection(null)
        return
      }

      setPositions([...positions, freshOption])
    }
    
    setTimeout(() => {
      setSwipeDirection(null)
      if (currentIndex < filteredOptions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setCurrentIndex(0)
      }
    }, 300)
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
              {/* Strike Price */}
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Strike Price</div>
                <div className="text-2xl font-bold text-white">${currentOption.strike.toLocaleString()}</div>
              </div>

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
                     type="number" 
                     min="0.0001"
                     step="0.0001"
                     value={investmentAmount}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (val === '' || parseFloat(val) >= 0) {
                         // Round down to 6 decimal places (USDC precision)
                         const rounded = Math.floor(parseFloat(val) * 1e6) / 1e6;
                         setInvestmentAmount(isNaN(rounded) ? '' : rounded.toString());
                       }
                     }}
                     className="text-xl font-bold w-24 text-center bg-transparent border-b-2 border-yellow-500/50 focus:outline-none focus:border-yellow-400 text-white"
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
                
                // Calculate profit at 5% move from strike
                const isCall = currentOption.type === 'CALL';
                const price5Percent = isCall 
                  ? currentOption.strike * 1.05 
                  : currentOption.strike * 0.95;
                
                // Calculate payout at 5% move using imported function
                const payout5Percent = payoutAtPrice(
                  currentOption.raw.order.strikes,
                  isCall,
                  numContracts,
                  price5Percent
                );
                const potentialProfit = payout5Percent - (parseFloat(investmentAmount) || 0);
                
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

      {/* Quick Stats */}
      <div className="flex justify-center gap-4 mt-6">
        <div className="rounded-xl px-6 py-3 text-center" style={{ background: 'rgba(26,26,26,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-lg font-bold text-white">{positions.length}</div>
          <div className="text-[10px] text-gray-500">BOUGHT</div>
        </div>
        <div className="rounded-xl px-6 py-3 text-center" style={{ background: 'rgba(26,26,26,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-lg font-bold text-white">{currentIndex}</div>
          <div className="text-[10px] text-gray-500">PASSED</div>
        </div>
      </div>
    </div>
  )
}
