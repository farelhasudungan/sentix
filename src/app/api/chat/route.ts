import { NextResponse } from 'next/server';
import { fetchThetanutsQuotesServer } from '@/lib/api/quotes';
import OpenAI from 'openai';
import type { Option } from '@/types';

// --- Types ---
type ChatRequest = {
  message: string;
  history: any[]; 
};

type ChatResponse = {
  response: string;
  recommendedTrade?: Option; 
};

// Initialize OpenAI
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// --- Tools Definition ---
const tools = [
  {
    type: "function" as const,
    function: {
      name: "find_trade",
      description: "Find the best option trade based on the user's criteria. Use this when the user asks for a trade recommendation, to buy an option, or for a specific strategy (bullish/bearish). IMPORTANT: Always extract the user's expiry preference if they mention a time period like '3 days', 'a week', '1 day', etc.",
      parameters: {
        type: "object",
        properties: {
          asset: {
            type: "string",
            enum: ["ETH", "BTC", "SOL", "BNB", "XRP", "ALL"],
            description: "The crypto asset to trade. e.g. ETH, BTC. Default to ALL if not specified.",
          },
          type: {
            type: "string",
            enum: ["CALL", "PUT"],
            description: "The option type. CALL for bullish/up, PUT for bearish/down.",
          },
          isBullish: {
            type: "boolean",
            description: "True if the user thinks price will go up (implies CALL), false otherwise.",
          },
          minExpiryDays: {
            type: "number",
            description: "Minimum days until expiry the user wants. Extract from phrases like '3 days', 'at least 2 days', 'a week' (7), 'few days' (3), etc. If user says 'around X days', use X. If not specified, default to 0.",
          },
          maxExpiryDays: {
            type: "number",
            description: "Maximum days until expiry. If user says 'around 3 days', set max to 5. If user says 'within a week', set max to 7. If not specified, leave undefined.",
          },
        },
        required: ["asset"],
      },
    },
  },
];

// --- Cached Responses (Templates) - No markdown bold ---
const CACHED_RESPONSES: Record<string, string> = {
  "what's a call?": 
    "A Call Option gives you the right to BUY an asset at a specific price (Strike Price) before a certain date.\n\n" +
    "📈 When to buy: You think the price will go UP.\n" +
    "💰 Profit: If price > strike, you earn the difference!\n" +
    "🛡️ Risk: Limited to the premium you paid.",
  
  "what's a put?":
    "A Put Option gives you the right to SELL an asset at a specific price (Strike Price) before a certain date.\n\n" +
    "📉 When to buy: You think the price will go DOWN.\n" +
    "💰 Profit: If price < strike, you earn the difference!\n" +
    "🛡️ Risk: Limited to the premium you paid.",

  "best strategy":
    "For beginners, the Long Call or Long Put is simplest!\n\n" +
    "1. Bullish? Buy a Call.\n" +
    "2. Bearish? Buy a Put.\n\n" +
    "💡 Pro Tip: Start with small amounts. Options are volatile!",
};

// Helper: Parse expiry days from "X days" string
function parseExpiryDays(expiryStr: string): number {
  const match = expiryStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper: Calculate potential payout info
function calculatePayoutInfo(trade: Option): string {
  const premium = trade.premium;
  const strike = trade.strike;
  const currentPrice = trade.currentPrice;
  
  // Calculate break-even
  let breakEven: number;
  let potentialProfit: string;
  
  if (trade.type === 'CALL') {
    breakEven = strike;
    potentialProfit = `Price needs to go above $${breakEven.toLocaleString()} to profit`;
  } else {
    breakEven = strike;
    potentialProfit = `Price needs to drop below $${breakEven.toLocaleString()} to profit`;
  }
  
  // Example: If you invest $10, max loss is $10
  const maxLoss = `Your max loss is limited to the premium you pay`;
  
  // Potential return calculation (if price moves 10% in your favor)
  const leverageInfo = `Options provide leverage - a small price move can mean big returns!`;
  
  return `\n\n💡 Why this trade?\n` +
    `• ${potentialProfit}\n` +
    `• ${maxLoss}\n` +
    `• ${leverageInfo}`;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json() as ChatRequest;
    const lowerMsg = message.toLowerCase().trim();

    // 1. Check Cache (Fast Path)
    if (CACHED_RESPONSES[lowerMsg]) {
      return NextResponse.json({ 
        response: CACHED_RESPONSES[lowerMsg] 
      } as ChatResponse);
    }

    // 2. Call OpenAI with enhanced system prompt (no markdown)
    const runner = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b:free",
      messages: [
        { 
          role: "system", 
          content: `You are Sentix AI, a helpful and friendly options trading assistant. Your goal is to simplify options trading for beginners.

IMPORTANT RULES:
1. Keep answers concise, emoji-rich, and easy to understand.
2. Do NOT use markdown formatting like **bold** or *italic* - just use plain text.
3. Do NOT give financial advice, but you can explain concepts and help find trades.
4. When users ask for trades, ALWAYS pay attention to their expiry preferences (e.g., "3 days", "a week").
5. Extract the exact number of days they want for expiry and pass it to the find_trade function.

Examples of expiry extraction:
- "I want a 3 day trade" → minExpiryDays: 3, maxExpiryDays: 5
- "around a week" → minExpiryDays: 5, maxExpiryDays: 9
- "at least 2 days" → minExpiryDays: 2
- "quick trade" or "1 day" → minExpiryDays: 1, maxExpiryDays: 2`
        },
        ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: message },
      ],
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = runner.choices[0].message;

    // 3. Handle Tool Calls
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.type === 'function' && toolCall.function.name === "find_trade") {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Fetch Live Data
        const quotes = await fetchThetanutsQuotesServer();
        
        // Logic to filter/find trade
        let filtered = quotes;
        
        // Filter by asset
        if (args.asset && args.asset !== 'ALL') {
          filtered = filtered.filter((q) => q.asset === args.asset);
        }

        // Determine type based on explicit type OR bullish/bearish intent
        let targetType = args.type;
        if (!targetType && args.isBullish !== undefined) {
          targetType = args.isBullish ? 'CALL' : 'PUT';
        }

        if (targetType) {
          filtered = filtered.filter((q) => q.type === targetType);
        }

        // Filter by expiry days preference
        const minExpiry = args.minExpiryDays || 0;
        const maxExpiry = args.maxExpiryDays || 365;
        
        filtered = filtered.filter((q) => {
          const days = parseExpiryDays(q.expiry);
          return days >= minExpiry && days <= maxExpiry;
        });

        // Sort by closest match to user's preferred expiry (if specified)
        if (args.minExpiryDays) {
          const targetDays = args.minExpiryDays;
          filtered.sort((a, b) => {
            const aDays = parseExpiryDays(a.expiry);
            const bDays = parseExpiryDays(b.expiry);
            return Math.abs(aDays - targetDays) - Math.abs(bDays - targetDays);
          });
        }

        // Pick the best matching trade
        const bestTrade = filtered.length > 0 ? filtered[0] : null;

        if (bestTrade) {
          const expiryInfo = args.minExpiryDays ? ` with ~${parseExpiryDays(bestTrade.expiry)} days expiry` : '';
          const payoutInfo = calculatePayoutInfo(bestTrade);
          
          return NextResponse.json({
            response: `I found a great trade for you! 🚀\n\nBased on your interest in ${args.asset || 'Crypto'} ${targetType ? `(${targetType})` : ''}${expiryInfo}:${payoutInfo}`,
            recommendedTrade: bestTrade
          } as ChatResponse);
        } else {
          const expiryHint = args.minExpiryDays ? ` with ${args.minExpiryDays}+ days expiry` : '';
          return NextResponse.json({
            response: `I looked for ${args.asset || 'Crypto'} ${targetType || ''} options${expiryHint}, but couldn't find a perfect match right now. 😓\n\nTry adjusting your expiry preference or check a different asset!`
          } as ChatResponse);
        }
      }
    }

    // 4. Standard Text Response - Strip markdown from AI response
    let content = responseMessage.content || "I'm not sure what to say to that! 🤖";
    // Remove **bold** markdown
    content = content.replace(/\*\*(.*?)\*\*/g, '$1');
    // Remove *italic* markdown
    content = content.replace(/\*(.*?)\*/g, '$1');
    
    return NextResponse.json({
      response: content
    } as ChatResponse);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ response: "Beep boop... I encountered an error. Please try again later!" }, { status: 500 });
  }
}
