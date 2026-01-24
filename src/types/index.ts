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
  greeks?: {
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
  premium: number;           // Total available premium in USD
  pricePerContract: number;  // Price per single contract in USD
  expiry: string;
  expiryTimestamp: number;
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
  closeTxHash: string;
  closeTimestamp: number;
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
  recommendedTrade?: Option;
}

// Tournament Types
export type TournamentStatus = 'upcoming' | 'live' | 'ended';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  prize_pool: string;
  prize_distribution: PrizeDistribution[] | null;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  created_at: string;
  updated_at: string;
}

// Prize distribution for each rank
export interface PrizeDistribution {
  rank: number;
  amount: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  wallet_address: string;
  joined_at: string;
}

export interface TournamentScore {
  id: string;
  tournament_id: string;
  wallet_address: string;
  total_premium_paid: number;
  total_profit: number;
  trade_count: number;
  streak_days: number;
  score: number;
  rank: number | null;
  last_trade_date: string | null;
  updated_at: string;
}

export interface TournamentWithStats extends Tournament {
  participant_count: number;
  user_joined?: boolean;
  user_rank?: number | null;
}

export interface LeaderboardEntry {
  wallet_address: string;
  score: number;
  rank: number;
  total_premium_paid: number;
  total_profit: number;
  trade_count: number;
  streak_days: number;
}

// Scoring weights
export const SCORING_WEIGHTS = {
  premiumPaid: 0.4,   // 40%
  profitRatio: 0.3,   // 30%
  tradeCount: 0.2,    // 20%
  streakDays: 0.1,    // 10%
} as const;

// Feed Types
export interface AttachedTrade {
  asset: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  expiryTimestamp: number;
  premium: number;
  currentPrice: number;
}

export interface FeedPost {
  id: string;
  wallet_address: string;
  content: string;
  attached_trade: AttachedTrade | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  user_liked?: boolean;
}

export interface FeedComment {
  id: string;
  post_id: string;
  wallet_address: string;
  content: string;
  created_at: string;
}

export interface FeedLike {
  id: string;
  post_id: string;
  wallet_address: string;
  created_at: string;
}
