-- Tournament System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🏆',
  prize_pool TEXT NOT NULL,
  prize_distribution JSONB DEFAULT '[]',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add prize_distribution column if table already exists
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_distribution JSONB DEFAULT '[]';

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, wallet_address)
);

-- Tournament scores (updated by scoring function)
CREATE TABLE IF NOT EXISTS tournament_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  total_premium_paid NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  pending_premium NUMERIC DEFAULT 0,  -- Premium from unsettled trades
  trade_count INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  score NUMERIC DEFAULT 0,
  rank INT,
  last_trade_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, wallet_address)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participants_wallet ON tournament_participants(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scores_tournament ON tournament_scores(tournament_id);
CREATE INDEX IF NOT EXISTS idx_scores_wallet ON tournament_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scores_score ON tournament_scores(tournament_id, score DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tournaments
CREATE POLICY "Allow public read tournaments" ON tournaments
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to tournaments
CREATE POLICY "Allow service role full access to tournaments" ON tournaments
  FOR ALL TO service_role
  USING (true);

-- Allow public read access to participants
CREATE POLICY "Allow public read participants" ON tournament_participants
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to participants
CREATE POLICY "Allow service role full access to participants" ON tournament_participants
  FOR ALL TO service_role
  USING (true);

-- Allow public read access to scores
CREATE POLICY "Allow public read scores" ON tournament_scores
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to scores
CREATE POLICY "Allow service role full access to scores" ON tournament_scores
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- SOCIAL FEED SYSTEM
-- ============================================

-- Feed posts table
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  attached_trade JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed likes table
CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, wallet_address)
);

-- Feed comments table
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES feed_posts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feed tables
CREATE INDEX IF NOT EXISTS idx_feed_posts_wallet ON feed_posts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_wallet ON feed_likes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_created ON feed_comments(created_at DESC);

-- Enable RLS for feed tables
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to feed posts
CREATE POLICY "Allow public read feed_posts" ON feed_posts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to feed posts
CREATE POLICY "Allow service role full access to feed_posts" ON feed_posts
  FOR ALL TO service_role
  USING (true);

-- Allow public read access to feed likes
CREATE POLICY "Allow public read feed_likes" ON feed_likes
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to feed likes
CREATE POLICY "Allow service role full access to feed_likes" ON feed_likes
  FOR ALL TO service_role
  USING (true);

-- Allow public read access to feed comments
CREATE POLICY "Allow public read feed_comments" ON feed_comments
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to feed comments
CREATE POLICY "Allow service role full access to feed_comments" ON feed_comments
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- USER NOTIFICATIONS SYSTEM
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trade_success', 'trade_error', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  tx_hash TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by wallet
CREATE INDEX IF NOT EXISTS idx_user_notifications_wallet ON user_notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(created_at DESC);

-- Enable RLS for user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to user notifications
CREATE POLICY "Allow public read user_notifications" ON user_notifications
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to user notifications
CREATE POLICY "Allow service role full access to user_notifications" ON user_notifications
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- USER ALIASES SYSTEM
-- ============================================

-- User aliases table (custom display names)
CREATE TABLE IF NOT EXISTS user_aliases (
  wallet_address TEXT PRIMARY KEY,
  alias TEXT UNIQUE NOT NULL CHECK (length(alias) >= 3 AND length(alias) <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for case-insensitive alias lookups
CREATE INDEX IF NOT EXISTS idx_user_aliases_alias ON user_aliases(LOWER(alias));

-- Enable RLS for user_aliases
ALTER TABLE user_aliases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to user aliases
CREATE POLICY "Allow public read user_aliases" ON user_aliases
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow service role full access to user aliases
CREATE POLICY "Allow service role full access to user_aliases" ON user_aliases
  FOR ALL TO service_role
  USING (true);
