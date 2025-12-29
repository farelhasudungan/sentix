// Thetanuts API Types

export interface ThetanutsOrder {
  order: {
    ticker: string;
    maker: string;
    orderExpiryTimestamp: number;
    collateral: string;
    isCall: boolean;
    priceFeed: string;
    implementation: string;
    isLong: boolean;
    maxCollateralUsable: string;
    strikes: number[];
    expiry: number;
    price: string;
    numContracts: string;
    extraOptionData: string;
  };
  signature: string;
  chainId: number;
  optionBookAddress: string;
  nonce: string;
  greeks: {
    delta: number;
    iv: number;
    gamma: number;
    theta: number;
    vega: number;
  };
}

export interface ThetanutsApiResponse {
  data: {
    timestamp: string;
    orders: ThetanutsOrder[];
    market_data: Record<string, number>;
  };
}

// Internal Option type for UI
export interface Option {
  id: number;
  asset: string;
  coinName: string;
  currentPrice: number;
  type: 'CALL' | 'PUT';
  strike: number;
  premium: number;
  expiry: string;
  apy: number;
  raw: ThetanutsOrder;
}

// User Position from the indexer API
export interface UserPosition {
  address: string;
  status: 'open' | 'settled';
  buyer: string;
  seller: string;
  referrer: string;
  createdBy: string;
  entryTimestamp: number;
  entryTxHash: string;
  entryPremium: string;
  entryFeePaid: string;
  collateralToken: string;
  collateralSymbol: string;
  collateralDecimals: number;
  underlyingAsset: string;
  priceFeed: string;
  strikes: string[];
  expiryTimestamp: number;
  numContracts: string;
  collateralAmount: string;
  optionType: number;
  settlement: {
    settlementPrice: string;
    payoutBuyer: string;
    payoutSeller: string;
  } | null;
  explicitClose: {
    closeTxHash: string;
    closeTimestamp: number;
  } | null;
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
