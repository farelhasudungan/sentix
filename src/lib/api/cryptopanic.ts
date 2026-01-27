/**
 * CryptoPanic API Integration (Developer Plan)
 * Fetches crypto news with sentiment data for analysis
 * NOTE: Developer tier has limited fields (title, description, published_at, kind)
 */

const CRYPTOPANIC_API_BASE = 'https://cryptopanic.com/api/developer/v2';

// Supported currencies for filtering
const SUPPORTED_CURRENCIES = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

// Asset keywords for detection from title/description
const ASSET_KEYWORDS: Record<string, string[]> = {
  'BTC': ['bitcoin', 'btc', '$btc'],
  'ETH': ['ethereum', 'eth', '$eth', 'ether'],
  'SOL': ['solana', 'sol', '$sol'],
  'BNB': ['binance', 'bnb', '$bnb'],
  'XRP': ['ripple', 'xrp', '$xrp'],
};

// Main post object from CryptoPanic API (Developer tier has limited fields)
export interface CryptoPanicPost {
  // Always available in Developer tier
  title: string;
  description?: string | null;
  published_at: string;
  created_at: string;
  kind: string;
  
  // Only in higher tiers (Growth/Enterprise)
  id?: number;
  slug?: string;
  source?: {
    title: string;
    region: string;
    domain: string;
    type: string;
  };
  original_url?: string;
  url?: string;
  image?: string;
  instruments?: Array<{
    code: string;
    title: string;
  }>;
  votes?: {
    negative: number;
    positive: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
    comments: number;
  };
}

interface CryptoPanicResponse {
  next: string | null;
  previous: string | null;
  results: CryptoPanicPost[];
}

/**
 * Get API Key from environment
 */
function getApiKey(): string {
  const key = process.env.CRYPTOPANIC_API_KEY;
  if (!key) {
    throw new Error('CRYPTOPANIC_API_KEY is not configured');
  }
  return key;
}

/**
 * Generate a unique ID from post title and published_at
 */
export function generatePostId(post: CryptoPanicPost): string {
  // Create a simple hash from title + published_at
  const str = `${post.title}-${post.published_at}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Extract mentioned assets from post title/description
 */
export function extractAssetsFromPost(post: CryptoPanicPost): string[] {
  const text = `${post.title} ${post.description || ''}`.toLowerCase();
  const foundAssets = new Set<string>();

  for (const [asset, keywords] of Object.entries(ASSET_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        foundAssets.add(asset);
        break;
      }
    }
  }

  return Array.from(foundAssets);
}

/**
 * Fetch all recent crypto news
 */
export async function fetchAllCryptoNews(): Promise<CryptoPanicPost[]> {
  try {
    const params = new URLSearchParams({
      auth_token: getApiKey(),
      public: 'true',
      kind: 'news',
    });

    // Filter to only supported currencies
    params.append('currencies', SUPPORTED_CURRENCIES.join(','));

    const url = `${CRYPTOPANIC_API_BASE}/posts/?${params}`;
    console.log('Fetching CryptoPanic news:', url.replace(getApiKey(), '***'));

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CryptoPanic API Error:', response.status, errorText);
      throw new Error(`CryptoPanic API error: ${response.status}`);
    }

    const data: CryptoPanicResponse = await response.json();
    console.log('CryptoPanic response:', data.results?.length, 'posts');
    
    // Filter out posts without title
    const validPosts = (data.results || []).filter(post => post && post.title);
    console.log('Valid posts with title:', validPosts.length);
    
    return validPosts;
  } catch (error) {
    console.error('Failed to fetch CryptoPanic news:', error);
    return [];
  }
}

/**
 * Analyze sentiment from post content using keywords
 * (Since Developer tier doesn't have votes)
 */
export function analyzeSentimentFromContent(post: CryptoPanicPost): {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
} {
  const text = `${post.title} ${post.description || ''}`.toLowerCase();
  
  const bullishKeywords = ['surge', 'soar', 'rally', 'bullish', 'gain', 'rise', 'up', 'high', 'record', 'ath', 'moon', 'pump', 'buy', 'accumulate', 'undervalued'];
  const bearishKeywords = ['crash', 'plunge', 'drop', 'bearish', 'loss', 'fall', 'down', 'low', 'dip', 'dump', 'sell', 'fear', 'correction', 'decline', 'slip', 'slide', 'pullback'];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const keyword of bullishKeywords) {
    if (text.includes(keyword)) bullishScore++;
  }
  
  for (const keyword of bearishKeywords) {
    if (text.includes(keyword)) bearishScore++;
  }
  
  const totalScore = bullishScore + bearishScore;
  
  if (totalScore === 0) {
    return { sentiment: 'neutral', confidence: 50 };
  }
  
  if (bullishScore > bearishScore) {
    const confidence = Math.min(85, 50 + (bullishScore / totalScore) * 40);
    return { sentiment: 'bullish', confidence };
  } else if (bearishScore > bullishScore) {
    const confidence = Math.min(85, 50 + (bearishScore / totalScore) * 40);
    return { sentiment: 'bearish', confidence };
  } else {
    return { sentiment: 'neutral', confidence: 55 };
  }
}

export type { CryptoPanicResponse };
