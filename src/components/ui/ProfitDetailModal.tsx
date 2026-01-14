'use client';

import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import type { Option } from '@/types';
import { payoutAtPrice, getStrikeWidth } from '@/lib/api/payouts';

interface ProfitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: Option;
  investmentAmount: number;
}

interface ProfitScenario {
  price: number;
  priceDelta: string;
  profit: number;
  profitPercent: number;
  isProfit: boolean;
  label: string;
}

export function ProfitDetailModal({ isOpen, onClose, option, investmentAmount }: ProfitDetailModalProps) {
  
  // Calculate profit scenarios at different price levels
  const profitScenarios = useMemo(() => {
    const strikes = option.raw.order.strikes;
    const isCall = option.type === 'CALL';
    const numContracts = investmentAmount / option.pricePerContract;
    const strike = option.strike;
    
    // Calculate profit at a given price
    const getProfitAt = (price: number) => {
      const payout = payoutAtPrice(strikes, isCall, numContracts, price);
      const profit = payout - investmentAmount;
      const profitPercent = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;
      return { profit, profitPercent };
    };

    // Calculate breakeven price
    const premium = investmentAmount / numContracts;
    const breakeven = isCall ? strike + premium : strike - premium;

    // Generate scenarios
    const scenarios: ProfitScenario[] = [];

    // Loss scenario (at strike)
    const lossResult = getProfitAt(strike);
    scenarios.push({
      price: strike,
      priceDelta: isCall ? 'At or below' : 'At or above',
      profit: lossResult.profit,
      profitPercent: lossResult.profitPercent,
      isProfit: false,
      label: 'Max Loss'
    });

    // Breakeven
    const breakevenResult = getProfitAt(breakeven);
    scenarios.push({
      price: breakeven,
      priceDelta: 'Breakeven',
      profit: breakevenResult.profit,
      profitPercent: breakevenResult.profitPercent,
      isProfit: false,
      label: 'Breakeven'
    });

    // Profit scenarios at different levels (1% to 5%)
    const profitLevels = [
      { percent: 0.01, label: '+1%' },
      { percent: 0.02, label: '+2%' },
      { percent: 0.03, label: '+3%' },
      { percent: 0.04, label: '+4%' },
      { percent: 0.05, label: '+5%' },
    ];

    profitLevels.forEach(level => {
      const price = isCall 
        ? strike * (1 + level.percent)
        : strike * (1 - level.percent);
      const result = getProfitAt(price);
      
      scenarios.push({
        price,
        priceDelta: `${isCall ? 'Strike' : 'Strike'} ${level.label}`,
        profit: result.profit,
        profitPercent: result.profitPercent,
        isProfit: result.profit > 0,
        label: `${isCall ? '+' : '-'}${(level.percent * 100).toFixed(0)}% Move`
      });
    });

    return {
      scenarios,
      breakeven,
      currentPrice: option.currentPrice,
      strike,
      isCall,
      numContracts
    };
  }, [option, investmentAmount]);

  if (!isOpen) return null;

  // Format currency
  const formatMoney = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center p-4" 
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto"
        style={{ background: 'rgba(20,20,20,0.95)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-white text-lg">Profit Scenarios</h2>
            <p className="text-sm text-gray-400">
              {option.asset} {option.type} • ${option.strike.toLocaleString()}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-[10px] text-gray-500 uppercase">Investment</div>
            <div className="text-sm font-semibold text-white">{formatMoney(investmentAmount)}</div>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-[10px] text-gray-500 uppercase">Contracts</div>
            <div className="text-sm font-semibold text-white">{profitScenarios.numContracts.toFixed(4)}</div>
          </div>
          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div className="text-[10px] text-blue-400 uppercase">Breakeven</div>
            <div className="text-sm font-semibold text-blue-400">{formatPrice(profitScenarios.breakeven)}</div>
          </div>
        </div>

        {/* Current Market Info */}
        <div className="mb-4 p-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Current Price</span>
          </div>
          <span className="text-sm font-semibold text-white">{formatPrice(profitScenarios.currentPrice)}</span>
        </div>

        {/* Profit Scenarios Table */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">If {option.asset} settles at:</div>
          
          {profitScenarios.scenarios.map((scenario, index) => (
            <div 
              key={index}
              className={`p-3 rounded-xl flex items-center justify-between ${
                scenario.label === 'Max Loss' 
                  ? 'bg-red-500/10 border border-red-500/30'
                  : scenario.label === 'Breakeven'
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : scenario.isProfit 
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {scenario.label === 'Max Loss' ? (
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                  ) : scenario.label === 'Breakeven' ? (
                    <Target className="w-3 h-3 text-yellow-400" />
                  ) : scenario.isProfit ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    scenario.label === 'Max Loss' ? 'text-red-400' 
                    : scenario.label === 'Breakeven' ? 'text-yellow-400'
                    : scenario.isProfit ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {scenario.label}
                  </span>
                </div>
                <div className="text-sm text-white font-semibold mt-1">{formatPrice(scenario.price)}</div>
                <div className="text-[10px] text-gray-500">{scenario.priceDelta}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  scenario.profit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {scenario.profit >= 0 ? '+' : ''}{formatMoney(scenario.profit)}
                </div>
                <div className={`text-xs ${
                  scenario.profitPercent >= 0 ? 'text-green-400/70' : 'text-red-400/70'
                }`}>
                  {scenario.profitPercent >= 0 ? '+' : ''}{scenario.profitPercent.toFixed(1)}% ROI
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-600 text-center mt-4">
          Settlement P&L depends on final price at expiry. Actual results may vary.
        </p>
      </div>
    </div>
  );
}
