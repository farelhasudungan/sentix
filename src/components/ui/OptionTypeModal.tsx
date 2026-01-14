'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { X, Info } from 'lucide-react';
import type { Option } from '@/types';
import { payoutAtPrice, getStructureType, getStrikeWidth } from '@/lib/api/payouts';

interface OptionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: Option;
  investmentAmount: number;
}

export function OptionTypeModal({ isOpen, onClose, option, investmentAmount }: OptionTypeModalProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Slider state - price that user is hovering/dragging on
  const [sliderPrice, setSliderPrice] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate chart data
  const chartData = useMemo(() => {
    const strikes = option.raw.order.strikes;
    const isCall = option.type === 'CALL';
    const numContracts = investmentAmount / option.pricePerContract;
    const strikeWidth = getStrikeWidth(strikes);
    
    // Price range: 20% below and above the strike price
    const centerPrice = option.strike;
    const minPrice = centerPrice * 0.8;
    const maxPrice = centerPrice * 1.2;
    const priceStep = (maxPrice - minPrice) / 100;
    
    const points: { price: number; payout: number; profit: number; profitPercent: number }[] = [];
    
    for (let price = minPrice; price <= maxPrice; price += priceStep) {
      const payout = payoutAtPrice(strikes, isCall, numContracts, price);
      const profit = payout - investmentAmount;
      const profitPercent = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;
      points.push({ price, payout, profit, profitPercent });
    }
    
    return {
      points,
      minPrice,
      maxPrice,
      minProfit: Math.min(...points.map(p => p.profitPercent)),
      maxProfit: Math.max(...points.map(p => p.profitPercent)),
      strikeWidth,
      numContracts,
    };
  }, [option, investmentAmount]);

  // Get option type description
  const optionTypeInfo = useMemo(() => {
    const structureType = getStructureType(option.raw.order.strikes.length);
    const isCall = option.type === 'CALL';
    
    const descriptions: Record<string, string> = {
      'Vanilla': isCall 
        ? 'A Call option gives you unlimited upside potential above the strike price. You profit when the price rises above your strike.'
        : 'A Put option profits when the price falls below the strike price. Your maximum profit is capped at the strike price.',
      'Spread': isCall
        ? 'A Call Spread has capped upside but lower cost. You profit when the price rises above the lower strike, with max profit at the upper strike.'
        : 'A Put Spread profits when price falls, with capped profit between the two strikes. Lower cost than a vanilla put.',
      'Butterfly': 'A Butterfly profits most when the price stays near the middle strike at expiry. Maximum profit at the center, zero profit at the wings.',
      'Condor': 'A Condor profits when price stays within a range. Maximum profit between the two middle strikes, tapering off outside.',
    };
    
    return {
      type: structureType,
      description: descriptions[structureType] || 'Custom option structure.',
    };
  }, [option]);

  // Calculate profit info at a given price
  const getProfitAtPrice = useCallback((price: number) => {
    const numContracts = investmentAmount / option.pricePerContract;
    const payout = payoutAtPrice(option.raw.order.strikes, option.type === 'CALL', numContracts, price);
    const profit = payout - investmentAmount;
    const profitPercent = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;
    
    return { payout, profit, profitPercent };
  }, [option, investmentAmount]);

  // Current display price (slider position or spot price)
  const displayPrice = sliderPrice ?? option.currentPrice;
  const currentProfitInfo = useMemo(() => getProfitAtPrice(displayPrice), [getProfitAtPrice, displayPrice]);

  if (!isOpen) return null;

  // Chart dimensions
  const chartWidth = 320;
  const chartHeight = 200;
  const padding = { top: 30, right: 50, bottom: 30, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate symmetric Y range centered on 0%
  const absMax = Math.max(Math.abs(chartData.minProfit), Math.abs(chartData.maxProfit), 100);
  const yMin = -absMax;
  const yMax = absMax;

  // Scale functions
  const xScale = (price: number) => 
    padding.left + ((price - chartData.minPrice) / (chartData.maxPrice - chartData.minPrice)) * innerWidth;
  
  const yScale = (profit: number) => 
    padding.top + innerHeight - ((profit - yMin) / (yMax - yMin)) * innerHeight;

  const xScaleInverse = (x: number) => 
    chartData.minPrice + ((x - padding.left) / innerWidth) * (chartData.maxPrice - chartData.minPrice);

  // 0% line should now be in the middle
  const zeroY = yScale(0);
  const strikeX = xScale(option.strike);
  const displayX = xScale(displayPrice);
  const displayY = yScale(currentProfitInfo.profitPercent);

  // Handle mouse/touch events for slider
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Calculate position as percentage of the SVG width
    const xPercent = (e.clientX - rect.left) / rect.width;
    
    // Map percentage to chart's inner area (accounting for padding)
    const paddingLeftPercent = padding.left / chartWidth;
    const paddingRightPercent = padding.right / chartWidth;
    const innerWidthPercent = 1 - paddingLeftPercent - paddingRightPercent;
    
    // Check if within the chart area
    if (xPercent >= paddingLeftPercent && xPercent <= 1 - paddingRightPercent) {
      // Map to price range
      const pricePercent = (xPercent - paddingLeftPercent) / innerWidthPercent;
      const price = chartData.minPrice + pricePercent * (chartData.maxPrice - chartData.minPrice);
      setSliderPrice(Math.max(chartData.minPrice, Math.min(chartData.maxPrice, price)));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setSliderPrice(null);
    }
  };

  // Format currency
  const formatMoney = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4" 
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full"
        style={{ background: 'rgba(20,20,20,0.95)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-white text-lg">Option Detail</h2>
            <p className="text-sm text-gray-400">
              {option.asset} {option.type} • ${option.strike.toLocaleString()} • {option.expiry}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Type Info */}
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-semibold text-sm">{optionTypeInfo.type} Option</span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">{optionTypeInfo.description}</p>
        </div>

        {/* Option Chart */}
        <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 underline">Option Chart:</span>
            <span className="text-xs text-gray-400">Profit (%)</span>
          </div>
          
          <svg 
            ref={svgRef}
            width={chartWidth} 
            height={chartHeight} 
            className="w-full cursor-default select-none"
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            style={{ touchAction: 'none' }}
          >
            {/* Grid line at 0% */}
            <line x1={padding.left} y1={zeroY} x2={chartWidth - padding.right} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeDasharray="4,4" />
            
            {/* Y-axis labels */}
            <text x={chartWidth - padding.right + 5} y={padding.top} fill="#9ca3af" fontSize="10" alignmentBaseline="middle">{yMax.toFixed(0)}%</text>
            <text x={chartWidth - padding.right + 5} y={zeroY} fill="#9ca3af" fontSize="10" alignmentBaseline="middle">0%</text>
            <text x={chartWidth - padding.right + 5} y={chartHeight - padding.bottom} fill="#9ca3af" fontSize="10" alignmentBaseline="middle">{yMin.toFixed(0)}%</text>

            {/* X-axis labels */}
            <text x={padding.left} y={chartHeight - 5} fill="#6b7280" fontSize="9">Price</text>
            <text x={padding.left + 30} y={chartHeight - 5} fill="#9ca3af" fontSize="10">{formatPrice(chartData.minPrice)}</text>
            <text x={strikeX} y={chartHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="middle">{formatPrice(option.strike)}</text>
            <text x={chartWidth - padding.right} y={chartHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="end">{formatPrice(chartData.maxPrice)}</text>

            {/* Profit/Loss line segments */}
            {chartData.points.map((point, i) => {
              if (i === 0) return null;
              const prev = chartData.points[i - 1];
              const x1 = xScale(prev.price);
              const y1 = yScale(prev.profitPercent);
              const x2 = xScale(point.price);
              const y2 = yScale(point.profitPercent);
              
              // Determine color based on profit
              const avgProfit = (prev.profitPercent + point.profitPercent) / 2;
              const color = avgProfit >= 0 ? '#22c55e' : '#ef4444';
              
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" />
              );
            })}

            {/* Strike price marker */}
            <line x1={strikeX} y1={padding.top} x2={strikeX} y2={chartHeight - padding.bottom} stroke="rgba(255,255,255,0.3)" strokeDasharray="3,3" strokeWidth="1" />

            {/* Interactive slider/glider line */}
            <line 
              x1={displayX} 
              y1={padding.top} 
              x2={displayX} 
              y2={chartHeight - padding.bottom} 
              stroke="rgba(255,255,255,0.8)" 
              strokeDasharray="4,4" 
              strokeWidth="1.5" 
            />

            {/* Slider dot on the line */}
            <circle 
              cx={displayX} 
              cy={displayY} 
              r="6" 
              fill="#fff" 
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            />
            <circle cx={displayX} cy={displayY} r="3" fill={currentProfitInfo.profitPercent >= 0 ? '#22c55e' : '#ef4444'} />

            {/* Price label at slider position */}
            <rect 
              x={displayX - 32} 
              y={padding.top - 18} 
              width="64" 
              height="16" 
              rx="4" 
              fill="rgba(255,255,255,0.9)" 
            />
            <text 
              x={displayX} 
              y={padding.top - 7} 
              fill="#1a1a1a" 
              fontSize="9" 
              fontWeight="600"
              textAnchor="middle"
            >
              {formatPrice(displayPrice)}
            </text>
          </svg>
          
          <p className="text-[10px] text-gray-500 text-center mt-1">Drag on chart to explore prices</p>
        </div>

        {/* Stats - Dynamic based on slider */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-gray-500 text-xs mb-1">Price:</div>
            <div className="text-white font-semibold">{formatPrice(displayPrice)}</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-gray-500 text-xs mb-1">Profit (%):</div>
            <div className={`font-semibold ${currentProfitInfo.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentProfitInfo.profitPercent.toFixed(2)}%
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-gray-500 text-xs mb-1">P&L ($):</div>
            <div className={`font-semibold ${currentProfitInfo.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentProfitInfo.profit >= 0 ? '+' : ''}{formatMoney(currentProfitInfo.profit)}
            </div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-gray-500 text-xs mb-1">Contracts:</div>
            <div className="text-white font-semibold">{chartData.numContracts.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
