import { formatUnits } from 'viem';
import { 
  ASSET_NAMES, 
  PRICE_DECIMALS, 
  STRIKE_DECIMALS 
} from '@/lib/constants';
import type { Option, ThetanutsApiResponse } from '@/types';

/**
 * Fetch option quotes from Thetanuts API
 * @returns {Promise<Option[]>} Array of option quotes
 */
export async function fetchThetanutsQuotes(): Promise<Option[]> {
  try {
    // Use internal proxy to avoid CORS
    const response = await fetch('/api/quotes');
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    const apiData: ThetanutsApiResponse = await response.json();
    
    // Extract market data for spot prices
    const marketData = apiData.data.market_data || {};

    return apiData.data.orders.map((item, index) => {
      const order = item.order;
      
      // Safety check for missing data
      if (!order || !order.ticker) {
        console.warn(`Skipping invalid order at index ${index}:`, item);
        return null; 
      }

      // Parse Ticker: "ETH-23DEC25-2925-P"
      const parts = order.ticker.split('-');
      
      if (parts.length < 4) {
         console.warn(`Skipping malformed ticker format: ${order.ticker}`);
         return null;
      }

      const asset = parts[0];
      
      // Convert Price (Premium)
      const premium = parseFloat(formatUnits(BigInt(order.price), PRICE_DECIMALS));

      // Convert Strike
      const strikeRaw = order.strikes[0];
      const strike = parseFloat(formatUnits(BigInt(strikeRaw), STRIKE_DECIMALS));

      // Use IV as APY proxy
      const apy = item.greeks.iv * 100;

      // Expiry Formatting
      const expiryDate = new Date(order.expiry * 1000);
      const now = new Date();
      const diffTime = Math.abs(expiryDate.getTime() - now.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      const expiryDisplay = `${diffDays} days`;

      return {
        id: index,
        asset: asset,
        coinName: ASSET_NAMES[asset] || asset,
        currentPrice: marketData[asset] || 0,
        type: order.isCall ? 'CALL' : 'PUT',
        strike: strike,
        premium: premium,
        expiry: expiryDisplay,
        apy: parseFloat(apy.toFixed(1)),
        raw: item,
      };
    }).filter((item): item is Option => item !== null);

  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return [];
  }
}
