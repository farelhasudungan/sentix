/**
 * Thetanuts Payout & Pricing Utilities
 * Based on: https://docs.thetanuts.finance/for-builders/payouts-and-pricing-intuition
 */

import { formatUnits } from 'viem';
import { STRIKE_DECIMALS } from '@/lib/constants';

/**
 * Calculate strike width based on option structure type
 * @param {Array} strikes - Array of strikes
 * @returns {number} Strike width
 */
export function getStrikeWidth(strikes: (bigint | number | string)[]): number {
  const k = strikes.map(s => parseFloat(formatUnits(BigInt(s), STRIKE_DECIMALS)));
  
  if (k.length === 1) {
    // Simple vanilla option - no bounded width, return strike as reference
    return k[0];
  }
  
  if (k.length === 2) {
    // Spreads (2 strikes)
    const [k1, k2] = k;
    return Math.abs(k2 - k1);
  }
  
  if (k.length === 3) {
    // Butterflies (3 strikes) - symmetric around middle
    const [lo, mid] = k;
    return mid - lo;
  }
  
  if (k.length === 4) {
    // Condors (4 strikes) - simplified
    return k[1] - k[0];
  }
  
  return 0;
}

/**
 * Calculate max payout for bounded structures
 * Max Payout = Strike Width × Number of Contracts
 * @param {number} strikeWidth - Strike width
 * @param {number} numContracts - Number of contracts
 * @returns {number} Max payout
 */
export function calculateMaxPayout(strikeWidth: number, numContracts: number): number {
  return strikeWidth * numContracts;
}

/**
 * Calculate payout at settlement for a given price
 * Handles spreads, butterflies, and condors
 * @param {Array} strikes - Array of strikes
 * @param {boolean} isCall - Whether the option is a call
 * @param {number} numContracts - Number of contracts
 * @param {number} settlementPrice - Settlement price
 * @returns {number} Payout at settlement
 */
export function payoutAtPrice(
  strikes: (bigint | number | string)[],
  isCall: boolean,
  numContracts: number,
  settlementPrice: number
): number {
  const K = strikes.map(s => parseFloat(formatUnits(BigInt(s), STRIKE_DECIMALS)));
  const S = settlementPrice;

  // Simple vanilla options (1 strike)
  if (K.length === 1) {
    const strike = K[0];
    if (isCall) {
      return Math.max(S - strike, 0) * numContracts;
    } else {
      return Math.max(strike - S, 0) * numContracts;
    }
  }

  // Spreads (2 strikes)
  if (K.length === 2) {
    const [L, U] = K;
    if (isCall) {
      if (S <= L) return 0;
      if (S >= U) return (U - L) * numContracts;
      return (S - L) * numContracts;
    } else {
      if (S >= U) return 0;
      if (S <= L) return (U - L) * numContracts;
      return (U - S) * numContracts;
    }
  }

  // Butterflies (3 strikes)
  if (K.length === 3) {
    const [L, M, U] = K;
    const w = M - L;
    if (S <= L || S >= U) return 0;
    if (S === M) return w * numContracts;
    return (S < M) 
      ? ((S - L) / w) * w * numContracts 
      : ((U - S) / w) * w * numContracts;
  }

  // Condors (4 strikes)
  if (K.length === 4) {
    const [K1, K2, K3, K4] = K;
    const max = (K2 - K1) * numContracts;
    if (S <= K1 || S >= K4) return 0;
    if (S >= K2 && S <= K3) return max;
    if (S < K2) return ((S - K1) / (K2 - K1)) * max;
    return ((K4 - S) / (K4 - K3)) * max;
  }

  return 0;
}

/**
 * Get option structure type label
 * @param {number} strikeCount - Number of strikes
 * @returns {string} Option structure type label
 */
export function getStructureType(strikeCount: number): string {
  switch (strikeCount) {
    case 1: return 'Vanilla';
    case 2: return 'Spread';
    case 3: return 'Butterfly';
    case 4: return 'Condor';
    default: return 'Unknown';
  }
}

/**
 * Get optimal profit target price based on option structure
 * For vanilla options: returns 5% move from strike
 * For spreads: returns the upper/lower bound strike
 * For butterflies: returns the middle strike
 * For condors: returns the midpoint of the sweet spot
 * @param {Array} strikes - Array of strikes (raw BigInt values)
 * @param {boolean} isCall - Whether the option is a call
 * @param {number} spotPrice - Current spot price (used for vanilla options fallback)
 * @returns {{ price: number; label: string }} Optimal price and label describing the scenario
 */
export function getOptimalProfitPrice(
  strikes: (bigint | number | string)[],
  isCall: boolean,
  spotPrice: number
): { price: number; label: string } {
  const K = strikes.map(s => parseFloat(formatUnits(BigInt(s), STRIKE_DECIMALS)));

  // Vanilla options (1 strike) - use 5% move from strike
  if (K.length === 1) {
    const strike = K[0];
    const price = isCall ? strike * 1.05 : strike * 0.95;
    return { 
      price, 
      label: `at 5% ${isCall ? 'up' : 'down'}` 
    };
  }

  // Spreads (2 strikes) - max profit at the boundary
  if (K.length === 2) {
    const [L, U] = K;
    if (isCall) {
      // Call spread: max profit when price >= upper strike
      return { price: U, label: `at $${U.toLocaleString()}` };
    } else {
      // Put spread: max profit when price <= lower strike
      return { price: L, label: `at $${L.toLocaleString()}` };
    }
  }

  // Butterflies (3 strikes) - max profit at middle strike
  if (K.length === 3) {
    const middle = K[1];
    return { 
      price: middle, 
      label: `at $${middle.toLocaleString()} (sweet spot)` 
    };
  }

  // Condors (4 strikes) - max profit in the middle range
  if (K.length === 4) {
    const K2 = K[1];
    const K3 = K[2];
    const sweetSpot = (K2 + K3) / 2;
    return { 
      price: sweetSpot, 
      label: `at $${sweetSpot.toLocaleString()} (sweet spot)` 
    };
  }

  // Fallback
  return { price: spotPrice, label: 'at current price' };
}

