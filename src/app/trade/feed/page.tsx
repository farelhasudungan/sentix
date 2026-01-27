'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, TrendingUp, Clock, Sparkles, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import type { FeedPost, SocialAnalysisPost } from '@/types'
import { fetchFeedPosts } from '@/lib/api/feed'
import { FeedPostCard } from '@/components/features/feed/FeedPostCard'
import { SocialAnalysisCard } from '@/components/features/feed/SocialAnalysisCard'
import { CreatePostModal } from '@/components/features/feed/CreatePostModal'
import { useWalletModal } from '@/context/WalletModalContext'
import { isAdminWallet } from '@/lib/supabase'

type FeedFilter = 'newest' | 'popular' | 'ai-insights'

// Fetch social analysis posts
async function fetchSocialAnalysisPosts(page: number = 1, limit: number = 10) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  const res = await fetch(`/api/feed/social-analysis?${params}`)
  if (!res.ok) throw new Error('Failed to fetch AI insights')
  return res.json() as Promise<{ posts: SocialAnalysisPost[]; hasMore: boolean; total: number }>
}

export default function FeedPage() {
  const { address, isConnected } = useAccount()
  const { openWalletModal } = useWalletModal()
  
  // Single filter state (Newest, Popular, AI Insights)
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('newest')
  
  // Community feed state
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // AI Insights state
  const [aiPosts, setAiPosts] = useState<SocialAnalysisPost[]>([])
  const [aiPage, setAiPage] = useState(1)
  const [aiHasMore, setAiHasMore] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const isAiMode = activeFilter === 'ai-insights'

  // Community feed query
  const { data: communityData, isLoading: communityLoading, isFetching: communityFetching, refetch: refetchCommunity } = useQuery({
    queryKey: ['feed-posts', page, address],
    queryFn: () => fetchFeedPosts(page, 10, address),
    staleTime: 30000,
    enabled: !isAiMode,
  })

  // AI Insights query
  const { data: aiData, isLoading: aiLoading, isFetching: aiFetching, refetch: refetchAi } = useQuery({
    queryKey: ['ai-insights', aiPage],
    queryFn: () => fetchSocialAnalysisPosts(aiPage, 10),
    staleTime: 30000,
    enabled: isAiMode,
  })

  // Update community posts
  useEffect(() => {
    if (communityData) {
      if (page === 1) {
        setPosts(communityData.posts)
      } else {
        setPosts(prev => [...prev, ...communityData.posts])
      }
      setHasMore(communityData.hasMore)
    }
  }, [communityData, page])

  // Update AI posts
  useEffect(() => {
    if (aiData) {
      if (aiPage === 1) {
        setAiPosts(aiData.posts)
      } else {
        setAiPosts(prev => [...prev, ...aiData.posts])
      }
      setAiHasMore(aiData.hasMore)
    }
  }, [aiData, aiPage])

  const handleRefresh = useCallback(() => {
    if (isAiMode) {
      setAiPage(1)
      refetchAi()
    } else {
      setPage(1)
      refetchCommunity()
    }
  }, [isAiMode, refetchCommunity, refetchAi])

  const handleLoadMore = () => {
    if (isAiMode) {
      if (aiHasMore && !aiFetching) {
        setAiPage(prev => prev + 1)
      }
    } else {
      if (hasMore && !communityFetching) {
        setPage(prev => prev + 1)
      }
    }
  }

  // Sync AI insights (fetch new tweets and analyze)
  const handleSyncAi = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/feed/social-analysis/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      })
      const result = await res.json()
      console.log('Sync result:', result)
      
      // Refresh the AI posts
      setAiPage(1)
      refetchAi()
    } catch (error) {
      console.error('Failed to sync AI insights:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePostCreated = () => {
    setPage(1)
    refetchCommunity()
  }

  const handleLikeChange = (postId: string, liked: boolean, newCount: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, user_liked: liked, like_count: newCount }
        : post
    ))
  }

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      })
      if (res.ok) {
        setPosts(prev => prev.filter(post => post.id !== postId))
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const handleCreateClick = () => {
    if (!isConnected) {
      openWalletModal()
      return
    }
    setIsCreateModalOpen(true)
  }

  // Sort community posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (activeFilter === 'popular') {
      return b.like_count - a.like_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const isLoading = isAiMode ? aiLoading : communityLoading
  const isFetching = isAiMode ? aiFetching : communityFetching
  const isAdmin = isAdminWallet(address)

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <p className="text-gray-500 text-sm">
            {isAiMode ? 'AI-powered market insights from News' : 'Share your trading thoughts'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAiMode && isAdmin && (
            <button
              onClick={handleSyncAi}
              disabled={isSyncing}
              className="flex items-center gap-1 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Sync new tweets from News"
            >
              <Zap className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={isFetching || isSyncing}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          
          {!isAiMode && (
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ 
                background: 'linear-gradient(to bottom, #ffd48d, #b78751)',
                color: '#1a1a1a'
              }}
            >
              <Plus className="w-4 h-4" />
              Post
            </button>
          )}
        </div>
      </div>

      {/* Unified Filter Bar: Newest | Popular | AI Insights */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('newest')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all ${
            activeFilter === 'newest'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Newest
        </button>
        <button
          onClick={() => setActiveFilter('popular')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all ${
            activeFilter === 'popular'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Popular
        </button>
        <button
          onClick={() => setActiveFilter('ai-insights')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all ${
            activeFilter === 'ai-insights'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">AI Insights</span>
          <span className="sm:hidden">AI</span>
        </button>
      </div>

      {/* Content */}
      {isLoading && (isAiMode ? aiPage === 1 : page === 1) ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading {isAiMode ? 'AI insights' : 'posts'}...</p>
        </div>
      ) : isAiMode ? (
        // AI Insights Feed
        aiPosts.length === 0 ? (
          <div 
            className="rounded-2xl p-8 text-center border border-purple-500/20"
            style={{ background: 'rgba(26,26,26,0.8)' }}
          >
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-lg font-bold text-white mb-2">No AI Insights Yet</h2>
            <p className="text-gray-500 text-sm mb-4">
              AI-analyzed posts from crypto news will appear here.
            </p>
            {isConnected && (
              <button
                onClick={handleSyncAi}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {isSyncing ? 'Syncing...' : 'Sync News'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {aiPosts.map((post) => (
              <SocialAnalysisCard key={post.id} post={post} />
            ))}

            {aiHasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={aiFetching}
                  className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {aiFetching ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        // Community Feed
        sortedPosts.length === 0 ? (
          <div 
            className="rounded-2xl p-8 text-center border border-white/10"
            style={{ background: 'rgba(26,26,26,0.8)' }}
          >
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-lg font-bold text-white mb-2">No posts yet</h2>
            <p className="text-gray-500 text-sm mb-4">
              Be the first to share your trading insights!
            </p>
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ 
                background: 'linear-gradient(to bottom, #ffd48d, #b78751)',
                color: '#1a1a1a'
              }}
            >
              <Plus className="w-4 h-4" />
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onLikeChange={handleLikeChange}
                onDelete={handleDelete}
              />
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={communityFetching}
                  className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {communityFetching ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}
