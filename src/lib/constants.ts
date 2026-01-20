export const THETANUTS_API_URL = 'https://round-snowflake-9c31.devops-118.workers.dev/';
export const REFERRER_ADDRESS = '0x46dc9557573efad018cf98f8d4e14a6da71e546c';
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
export const BASE_CHAIN_ID = 8453;
export const INDEXER_BASE_URL = 'https://optionbook-indexer.thetanuts.finance/api/v1';

// Asset mapping helpers
export const ASSET_NAMES: Record<string, string> = {
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  SOL: 'Solana',
  BNB: 'Binance Coin',
  XRP: 'XRP',
};

// Decimal configurations
export const DECIMALS: Record<string, number> = {
  ETH: 6,
  BTC: 6,
  SOL: 6,
  BNB: 6,
  XRP: 6
};

export const STRIKE_DECIMALS = 8; // Chainlink price feed standard
export const PRICE_DECIMALS = 8;  // Price decimals (8 decimal places)
export const USDC_DECIMALS = 6;   // USDC has 6 decimals
export const CONTRACT_DECIMALS = 8; // Contract quantities have 8 decimal places
