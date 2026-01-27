-- Social Analysis Feature Tables
-- Run this in Supabase SQL Editor

-- Table: whitelisted_accounts
-- Stores Twitter/X accounts to monitor for crypto insights
CREATE TABLE IF NOT EXISTS whitelisted_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  twitter_id TEXT,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: social_analysis_posts
-- Stores analyzed tweets with sentiment and trade suggestions
CREATE TABLE IF NOT EXISTS social_analysis_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id TEXT NOT NULL UNIQUE,
  account_username TEXT NOT NULL,
  account_display_name TEXT NOT NULL,
  content TEXT NOT NULL,
  tweet_url TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  assets_mentioned TEXT[] DEFAULT '{}',
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  sentiment_confidence REAL DEFAULT 0 CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 100),
  ai_summary TEXT,
  suggested_trade JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_social_posts_sentiment ON social_analysis_posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_analysis_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_assets ON social_analysis_posts USING GIN(assets_mentioned);
CREATE INDEX IF NOT EXISTS idx_whitelisted_active ON whitelisted_accounts(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE whitelisted_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analysis_posts ENABLE ROW LEVEL SECURITY;

-- Policies: Allow public read access
CREATE POLICY "Allow public read on whitelisted_accounts" 
  ON whitelisted_accounts FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read on social_analysis_posts" 
  ON social_analysis_posts FOR SELECT 
  USING (true);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access on whitelisted_accounts" 
  ON whitelisted_accounts FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on social_analysis_posts" 
  ON social_analysis_posts FOR ALL 
  USING (auth.role() = 'service_role');

-- Seed with some sample whitelisted accounts (optional - remove if you want to add manually)
-- INSERT INTO whitelisted_accounts (username, display_name, description) VALUES
--   ('elikimt', 'Crypto Analyst', 'Crypto market analysis');
