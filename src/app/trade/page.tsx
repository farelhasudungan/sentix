'use client'

import React, { useState } from 'react'
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
import { getStrikeWidth, calculateMaxPayout, getStructureType } from '@/lib/api/payouts'
import { FilterBar } from '@/components/ui/FilterBar'
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

export default function TradePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [positions, setPositions] = useState<Option[]>([])
  const [filter, setFilter] = useState('ALL')

  // Fetch live data
  const { data: optionsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['thetanuts-quotes'],
    queryFn: fetchThetanutsQuotes,
    refetchInterval: 30000,
  })

  // Derived state for filtered options
  const filteredOptions = optionsData.filter(
    (option) => filter === 'ALL' || option.asset === filter
  )

  const currentOption = filteredOptions[currentIndex]



  const { executeTrade, isPending, isConfirming } = useThetanutsTrade()

  // Investment amount state
  const [investmentAmount, setInvestmentAmount] = useState<string>('10')

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
    if (!currentOption) return

    setSwipeDirection(direction)
    
    if (direction === 'right') {
      const { data: freshOptions } = await refetch()
      
      const freshOption = freshOptions?.find(
        (opt) => opt.raw.optionBookAddress === currentOption.raw.optionBookAddress
      ) || currentOption
      
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
    <div className="px-4 py-6 pb-24 md:pb-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="pixel-font text-xl text-purple-800 mb-2">CARD OF THE DAY</h1>
          {isLoading && <p className="text-xs text-purple-500 animate-pulse">Scanning chain...</p>}
          {error && <p className="text-xs text-red-500">Error fetching data</p>}
        </div>

        {/* Filter Bar - Using extracted component */}
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
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-gray-500 text-sm">Current Price:</span>
              <span className="pixel-font text-lg text-purple-700">{formatMoney(currentOption.currentPrice)}</span>
            </div>

            <div 
              className={`relative bg-white border-4 p-6 transition-all duration-300 ${
                swipeDirection === 'left' 
                  ? 'transform -translate-x-full opacity-0 border-red-400' 
                  : swipeDirection === 'right' 
                    ? 'transform translate-x-full opacity-0 border-green-400' 
                    : currentOption.type === 'CALL' 
                      ? 'border-green-400' 
                      : 'border-red-400'
              }`}
              style={{boxShadow: '8px 8px 0 rgba(0,0,0,0.15)'}}
            >
              {/* Asset Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-white p-1">
                    {coinIcons[currentOption.asset] ? (
                      <Image 
                        src={coinIcons[currentOption.asset]} 
                        alt={currentOption.asset} 
                        width={60} 
                        height={60}
                        className="object-contain"
                      />
                    ) : (
                      <span className="pixel-font text-xs text-gray-500">{currentOption.asset}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="pixel-font text-2xl text-gray-900 leading-none">{currentOption.asset}</h2>
                  </div>
                </div>
                {/* CALL/PUT Badge */}
                <div className={`px-4 py-2 border-4 ${
                  currentOption.type === 'CALL'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-red-100 border-red-500 text-red-700'
                }`}>
                  <span className="pixel-font text-lg">{currentOption.type}</span>
                </div>
              </div>

              {/* Stats Layout */}
              <div className="space-y-4 mb-6">
                {/* Strike Price */}
                <div className="bg-gray-50 border-2 border-gray-200 p-4 text-center">
                  <div className="text-gray-500 text-xs mb-1 uppercase tracking-wide">Strike Price</div>
                  <div className="pixel-font text-2xl text-gray-900">${currentOption.strike.toLocaleString()}</div>
                </div>

                {/* Expiry & APY */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border-2 border-gray-200 p-3 text-center">
                    <div className="text-gray-500 text-xs mb-1 flex items-center justify-center gap-1 uppercase">
                      <Clock className="w-3 h-3" /> Expiry
                    </div>
                    <div className="pixel-font text-lg text-gray-800">{currentOption.expiry}</div>
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 p-3 text-center">
                    <div className="text-green-600 text-xs mb-1 flex items-center justify-center gap-1 uppercase">
                      <TrendingUp className="w-3 h-3" /> APY
                    </div>
                    <div className="pixel-font text-lg text-green-600">{currentOption.apy}%</div>
                  </div>
                </div>

                {/* Premium */}
                <div className="bg-purple-50 border-2 border-purple-200 p-4 text-center">
                  <div className="text-purple-600 text-xs mb-1 uppercase tracking-wide flex items-center justify-center gap-1">
                    <DollarSign className="w-3 h-3" /> Premium
                  </div>
                  <div className="pixel-font text-2xl text-purple-700">{currentOption.premium} {currentOption.asset}</div>
                </div>

                {/* Investment Input */}
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 text-center">
                   <label className="block text-yellow-700 text-xs uppercase mb-2">I want to invest</label>
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-xl">$</span>
                     <input 
                       type="number" 
                       min="0.01"
                       step="0.01"
                       value={investmentAmount}
                       onChange={(e) => {
                         const val = e.target.value;
                         if (val === '' || parseFloat(val) >= 0 ) {
                           setInvestmentAmount(val);
                         }
                       }}
                       className="pixel-font text-xl w-24 text-center bg-white border-b-2 border-yellow-400 focus:outline-none focus:border-yellow-600"
                     />
                   </div>
                   {parseFloat(investmentAmount) <= 0 && investmentAmount !== '' && (
                     <div className="text-[10px] text-red-500 mt-1">Amount must be greater than 0</div>
                   )}
                   <div className="text-[10px] text-gray-500 mt-1">
                     ≈ {((parseFloat(investmentAmount) || 0) / currentOption.premium).toFixed(4)} Contracts
                   </div>
                </div>

                {/* Max Payout & Potential Profit */}
                {(() => {
                  const numContracts = (parseFloat(investmentAmount) || 0) / currentOption.premium;
                  const strikeWidth = getStrikeWidth(currentOption.raw.order.strikes);
                  const maxPayout = calculateMaxPayout(strikeWidth, numContracts);
                  const potentialProfit = maxPayout - (parseFloat(investmentAmount) || 0);
                  const structureType = getStructureType(currentOption.raw.order.strikes.length);
                  
                  return (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 border-2 border-blue-200 p-3 text-center">
                        <div className="text-blue-600 text-xs mb-1 uppercase tracking-wide">
                          Max Payout
                        </div>
                        <div className="pixel-font text-lg text-blue-700">
                          {formatMoney(maxPayout)}
                        </div>
                        <div className="text-[9px] text-blue-400">{structureType}</div>
                      </div>
                      <div className={`border-2 p-3 text-center ${potentialProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`text-xs mb-1 uppercase tracking-wide ${potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Potential Profit
                        </div>
                        <div className={`pixel-font text-lg ${potentialProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {potentialProfit >= 0 ? '+' : ''}{formatMoney(potentialProfit)}
                        </div>
                        <div className={`text-[9px] ${potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {numContracts > 0 ? `${((potentialProfit / (parseFloat(investmentAmount) || 1)) * 100).toFixed(0)}% ROI` : '-'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Card Counter */}
              <div className="text-center text-gray-400 text-xs">
                {currentIndex + 1} / {filteredOptions.length}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border-4 border-gray-300 p-8 text-center" style={{boxShadow: '8px 8px 0 rgba(0,0,0,0.15)'}}>
            <div className="text-4xl mb-4">😴</div>
            <h2 className="pixel-font text-lg text-gray-600 mb-2">NO CARDS FOUND</h2>
            <p className="text-sm text-gray-500">Try selecting a different asset filter.</p>
          </div>
        )}

        {/* Swipe Buttons - Using extracted component */}
        {currentOption && (
          <SwipeButtons 
            onSwipeLeft={() => handleSwipe('left')}
            onSwipeRight={() => handleSwipe('right')}
            disabled={isPending || isConfirming}
          />
        )}

        {/* Quick Stats */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="bg-white border-2 border-gray-300 px-4 py-2 text-center">
            <div className="pixel-font text-xs text-gray-600">{positions.length}</div>
            <div className="text-[10px] text-gray-400">BOUGHT</div>
          </div>
          <div className="bg-white border-2 border-gray-300 px-4 py-2 text-center">
            <div className="pixel-font text-xs text-gray-600">{currentIndex}</div>
            <div className="text-[10px] text-gray-400">PASSED</div>
          </div>
        </div>
      </div>
    </div>
  )
}
