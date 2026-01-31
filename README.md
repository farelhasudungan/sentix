# Sentix

A gamified options trading platform built with Next.js, featuring swipeable trade cards, AI-powered trading guidance, social feed, and competitive tournaments.

## Features

- **Swipeable Trade Cards** - Tinder-style interface for quick options trading decisions
- **AI Trading Agent** - Get personalized trade recommendations powered by OpenAI
- **Social Feed** - Share trades, post ideas, and engage with the community
- **Tournaments** - Compete with other traders in leaderboard-based competitions
- **Wallet Integration** - Connect via WalletConnect for seamless Web3 experience

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack React Query
- **Database**: Supabase
- **Wallet**: wagmi + viem + WalletConnect
- **AI**: OpenAI / OpenRouter SDK
- **Analytics**: Vercel Analytics

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── chat/           # AI chat endpoints
│   │   ├── feed/           # Social feed & analysis
│   │   ├── notifications/  # User notifications
│   │   ├── quotes/         # Options quotes
│   │   ├── tournaments/    # Tournament management
│   │   └── user/           # User management
│   └── trade/              # Trading pages
│       ├── agent/          # AI trading agent
│       ├── feed/           # Social feed
│       ├── games/          # Gamification features
│       ├── position/       # Position management
│       └── settings/       # User settings
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── advanced/       # Advanced trading components
│   │   ├── feed/           # Feed components
│   │   └── trade/          # Trading components
│   ├── layout/             # Layout components
│   └── ui/                 # Reusable UI components
├── context/                # React contexts
├── hooks/                  # Custom React hooks
│   ├── useChat.tsx         # AI chat hook
│   ├── useThetanutsTrade.ts # Trading execution hook
│   ├── useTournaments.ts   # Tournament data hook
│   └── useUserAlias.ts     # User alias management
├── lib/                    # Utilities and configurations
│   ├── api/                # API client functions
│   ├── config/             # App configuration
│   ├── contracts/          # Smart contract ABIs
│   ├── constants.ts        # App constants
│   └── supabase.ts         # Supabase client
├── styles/                 # Global styles
└── types/                  # TypeScript type definitions

supabase/
└── migrations/             # Database migrations

public/                     # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd sentix
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Configure the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `OPENAI_API_KEY` - OpenAI API key for AI features
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## License

All rights reserved.
