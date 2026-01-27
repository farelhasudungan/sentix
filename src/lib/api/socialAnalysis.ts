/**
 * Social Analysis Service
 * AI-powered sentiment analysis for crypto news from CryptoPanic
 * Works with Developer tier (limited fields)
 */

import OpenAI from 'openai';
import { fetchThetanutsQuotesServer } from './quotes';
import { 
  extractAssetsFromPost,
  analyzeSentimentFromContent,
  type CryptoPanicPost 
} from './cryptopanic';
import type { SentimentType, SuggestedTrade } from '@/types';

// Initialize OpenAI via OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

interface SentimentAnalysisResult {
  sentiment: SentimentType;
  confidence: number;
  summary: string;
  assets: string[];
}

/**
 * Analyze news title/content using AI for more nuanced sentiment
 */
export async function analyzeNewsSentiment(
  title: string,
  description: string | null | undefined,
  keywordSentiment: SentimentType,
  keywordConfidence: number
): Promise<SentimentAnalysisResult> {
  try {
    const content = description ? `${title}\n${description}` : title;
    
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a crypto market sentiment analyzer. Analyze the given news and determine:
1. Sentiment: 'bullish' (price will go up), 'bearish' (price will go down), or 'neutral'
2. Confidence: 0-100% how confident you are
3. Summary: A brief 1-sentence trading insight

Initial keyword analysis suggests: "${keywordSentiment}" with ${keywordConfidence.toFixed(0)}% confidence.

Respond in JSON format only:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 75,
  "summary": "Brief trading insight..."
}`
        },
        {
          role: 'user',
          content: `Analyze this crypto news:\n\n"${content}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize
    const validSentiments: SentimentType[] = ['bullish', 'bearish', 'neutral'];
    const sentiment: SentimentType = validSentiments.includes(parsed.sentiment) 
      ? parsed.sentiment 
      : keywordSentiment;
    
    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || keywordConfidence));
    const summary = parsed.summary || 'No summary available';

    return {
      sentiment,
      confidence,
      summary,
      assets: [],
    };
  } catch (error) {
    console.error('AI Sentiment analysis error:', error);
    
    // Fallback to keyword-based sentiment
    return {
      sentiment: keywordSentiment,
      confidence: keywordConfidence,
      summary: `Market analysis based on keyword detection`,
      assets: [],
    };
  }
}

/**
 * Find matching trade suggestion based on sentiment and assets
 */
export async function matchTradeSuggestion(
  sentiment: SentimentType,
  assets: string[]
): Promise<SuggestedTrade | null> {
  if (sentiment === 'neutral' || assets.length === 0) {
    return null;
  }

  try {
    const quotes = await fetchThetanutsQuotesServer();
    
    // Determine option type based on sentiment
    const optionType = sentiment === 'bullish' ? 'CALL' : 'PUT';
    
    // Filter quotes to match sentiment and assets
    const matchingQuotes = quotes.filter(q => 
      assets.includes(q.asset) && q.type === optionType
    );

    if (matchingQuotes.length === 0) {
      // Try any quote matching the option type for the first mentioned asset
      const fallbackQuotes = quotes.filter(q => 
        q.asset === assets[0] && q.type === optionType
      );
      
      if (fallbackQuotes.length > 0) {
        const best = fallbackQuotes[0];
        return {
          asset: best.asset,
          type: best.type,
          strike: best.strike,
          expiry: best.expiry,
          expiryTimestamp: best.expiryTimestamp,
          premium: best.premium,
          pricePerContract: best.pricePerContract,
          currentPrice: best.currentPrice,
          leverage: best.apy,
        };
      }
      return null;
    }

    // Sort by closest expiry first
    matchingQuotes.sort((a, b) => a.expiryTimestamp - b.expiryTimestamp);
    
    const best = matchingQuotes[0];
    return {
      asset: best.asset,
      type: best.type,
      strike: best.strike,
      expiry: best.expiry,
      expiryTimestamp: best.expiryTimestamp,
      premium: best.premium,
      pricePerContract: best.pricePerContract,
      currentPrice: best.currentPrice,
      leverage: best.apy,
    };
  } catch (error) {
    console.error('Error matching trade suggestion:', error);
    return null;
  }
}

/**
 * Full analysis pipeline for a CryptoPanic news post
 */
export async function analyzeNewsPost(post: CryptoPanicPost): Promise<{
  sentiment: SentimentType;
  confidence: number;
  summary: string;
  assets: string[];
  suggestedTrade: SuggestedTrade | null;
}> {
  // Step 1: Get keyword-based sentiment (fast fallback)
  const keywordSentiment = analyzeSentimentFromContent(post);
  
  // Step 2: Extract assets from title/description
  const assets = extractAssetsFromPost(post);

  // Step 3: Enhance with AI analysis
  const aiAnalysis = await analyzeNewsSentiment(
    post.title,
    post.description,
    keywordSentiment.sentiment,
    keywordSentiment.confidence
  );
  
  // Step 4: Match trade suggestion
  const suggestedTrade = await matchTradeSuggestion(aiAnalysis.sentiment, assets);

  return {
    sentiment: aiAnalysis.sentiment,
    confidence: aiAnalysis.confidence,
    summary: aiAnalysis.summary,
    assets,
    suggestedTrade,
  };
}
