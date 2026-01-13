import { formatUnits } from 'viem';
import { 
  ASSET_NAMES, 
  PRICE_DECIMALS, 
  STRIKE_DECIMALS,
  THETANUTS_API_URL,
  USDC_DECIMALS
} from '@/lib/constants';
import type { Option, ThetanutsApiResponse } from '@/types';

/**
 * Parse raw API data into Option objects (shared logic)
 * @param apiData - Raw API response data
 * @returns Array of Option objects
 */
function parseQuotesResponse(apiData: ThetanutsApiResponse): Option[] {
  const marketData = apiData.data.market_data;

  return apiData.data.orders.map((item, index) => {
    const order = item.order;
    
    if (!order || !order.ticker) {
      console.warn(`Skipping invalid order at index ${index}:`, item);
      return null; 
    }

    const parts = order.ticker.split('-');
    
    if (parts.length < 4) {
       console.warn(`Skipping malformed ticker format: ${order.ticker}`);
       return null;
    }

    const asset = parts[0];
    const pricePerContract = parseFloat(formatUnits(BigInt(order.price), PRICE_DECIMALS));
    const strikeRaw = order.strikes[0];
    const strike = parseFloat(formatUnits(BigInt(strikeRaw), STRIKE_DECIMALS));
    
    // Calculate max contracts from maxCollateralUsable (USDC has 6 decimals)
    // For USDC-collateralized options (all assets now): maxContracts = maxCollateralUsable / strike
    const maxCollateralUsable = parseFloat(formatUnits(BigInt(order.maxCollateralUsable), USDC_DECIMALS));
    const maxContracts = strike > 0 ? (maxCollateralUsable / strike) * 0.9999 : 0; // Apply safety factor
    
    // Total available premium = maxContracts * pricePerContract
    const totalAvailablePremium = maxContracts * pricePerContract;
    
    // Calculate leverage: leverage = spot / pricePerContract
    // Premium from API is in USDC for all options
    const MAX_LEVERAGE = 10000;
    const spotPrice = marketData[asset] || 0;
    const leverage = pricePerContract > 0 ? Math.min(spotPrice / pricePerContract, MAX_LEVERAGE) : 0;
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
      premium: totalAvailablePremium, // Total available premium in USD
      pricePerContract: pricePerContract, // Price per single contract
      expiry: expiryDisplay,
      expiryTimestamp: order.expiry,
      apy: parseFloat(leverage.toFixed(2)),
      raw: item,
    };
  }).filter((item): item is Option => item !== null);
}

/**
 * Fetch option quotes
 */
export async function fetchThetanutsQuotes(): Promise<Option[]> {
  try {
    const response = await fetch('/api/quotes');
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    const apiData: ThetanutsApiResponse = await response.json();
    return parseQuotesResponse(apiData);
  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return [];
  }
}

/**
 * Fetch option quotes server-side
 */
export async function fetchThetanutsQuotesServer(): Promise<Option[]> {
  try {
    const response = await fetch(THETANUTS_API_URL, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // Always get fresh data
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    const apiData: ThetanutsApiResponse = await response.json();
    return parseQuotesResponse(apiData);
  } catch (error) {
    console.error("Failed to fetch quotes (server):", error);
    return [];
  }
}

