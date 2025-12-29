import { formatUnits } from 'viem';
import { REFERRER_ADDRESS, INDEXER_BASE_URL } from '@/lib/constants';
import type { UserPosition } from '@/types';

/**
 * Trigger sync after a trade
 * @returns {Promise<boolean>} True if sync was triggered successfully, false otherwise
 */
export async function triggerSync(): Promise<boolean> {
  try {
    const response = await fetch(`${INDEXER_BASE_URL}/update`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.status === 'skipped') {
      console.log('Sync skipped, will retry...');
      return false;
    }
    
    console.log('Sync triggered successfully');
    return true;
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    return false;
  }
}

/**
 * Fetch user's open positions (filtered by platform referrer)
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<UserPosition[]>} Array of user's open positions
 */
export async function fetchUserPositions(userAddress: string): Promise<UserPosition[]> {
  if (!userAddress) return [];
  
  try {
    const response = await fetch(`${INDEXER_BASE_URL}/user/${userAddress}/positions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.statusText}`);
    }
    const data: UserPosition[] = await response.json();
    
    // Filter by platform referrer
    return data.filter(
      p => p.referrer.toLowerCase() === REFERRER_ADDRESS.toLowerCase()
    );
  } catch (error) {
    console.error('Failed to fetch user positions:', error);
    return [];
  }
}

/**
 * Fetch user's settled/closed history (filtered by platform referrer)
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<UserPosition[]>} Array of user's settled/closed history
 */
export async function fetchUserHistory(userAddress: string): Promise<UserPosition[]> {
  if (!userAddress) return [];
  
  try {
    const response = await fetch(`${INDEXER_BASE_URL}/user/${userAddress}/history`);
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    const data: UserPosition[] = await response.json();
    
    // Filter by platform referrer
    return data.filter(
      p => p.referrer.toLowerCase() === REFERRER_ADDRESS.toLowerCase()
    );
  } catch (error) {
    console.error('Failed to fetch user history:', error);
    return [];
  }
}

/**
 * Helper to determine if option is CALL or PUT from optionType
 * @param {number} optionType - Option type (0 for CALL, 1 for PUT)
 * @returns {'CALL' | 'PUT'} Option type label
 */
export function getOptionTypeLabel(optionType: number): 'CALL' | 'PUT' {
  return optionType % 2 === 0 ? 'CALL' : 'PUT';
}

/**
 * Helper to format position for display
 * @param {UserPosition} position - User's position
 * @returns {UserPosition} Formatted position
 */
export function formatPosition(position: UserPosition) {
  const decimals = position.collateralDecimals || 6;
  const strikeDecimals = 8;
  
  const premium = parseFloat(formatUnits(BigInt(position.entryPremium), decimals));
  const strikes = position.strikes.map(s => parseFloat(formatUnits(BigInt(s), strikeDecimals)));
  const numContracts = parseFloat(formatUnits(BigInt(position.numContracts), decimals));
  
  const expiryDate = new Date(position.expiryTimestamp * 1000);
  const now = new Date();
  const isExpired = expiryDate < now;
  const diffTime = Math.abs(expiryDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let payout = 0;
  if (position.settlement && position.settlement.payoutBuyer) {
    payout = parseFloat(formatUnits(BigInt(position.settlement.payoutBuyer), decimals));
  }
  
  return {
    id: position.address,
    asset: position.underlyingAsset,
    type: getOptionTypeLabel(position.optionType),
    strike: strikes[0] || 0,
    premium,
    numContracts,
    expiry: expiryDate.toLocaleDateString(),
    expiresIn: isExpired ? 'Expired' : `${diffDays}d`,
    status: position.status === 'open' ? 'ACTIVE' : (payout > 0 ? 'WON' : 'LOST'),
    pnl: payout - premium,
    pnlPercent: premium > 0 ? ((payout - premium) / premium) * 100 : 0,
    entryTxHash: position.entryTxHash,
    raw: position,
  };
}
