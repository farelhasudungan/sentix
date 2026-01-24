'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, TrendingUp, Clock } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FeedPost } from '@/types'
import { fetchFeedPosts } from '@/lib/api/feed'
import { FeedPostCard } from '@/components/features/feed/FeedPostCard'
import { CreatePostModal } from '@/components/features/feed/CreatePostModal'
import { useWalletModal } from '@/context/WalletModalContext'

type SortOption = 'newest' | 'popular'

export default function FeedPage() {
  const { address, isConnected } = useAccount()
  const { openWalletModal } = useWalletModal()
  const queryClient = useQueryClient()
  
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['feed-posts', page, address],
    queryFn: () => fetchFeedPosts(page, 10, address),
    staleTime: 30000,
  })

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setPosts(data.posts)
      } else {
        setPosts(prev => [...prev, ...data.posts])
      }
      setHasMore(data.hasMore)
    }
  }, [data, page])

  const handleRefresh = useCallback(() => {
    setPage(1)
    refetch()
  }, [refetch])

  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage(prev => prev + 1)
    }
  }

  const handlePostCreated = () => {
    handleRefresh()
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

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.like_count - a.like_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <p className="text-gray-500 text-sm">Share your trading thoughts</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          
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
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('newest')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
            sortBy === 'newest'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Clock className="w-4 h-4" />
          Newest
        </button>
        <button
          onClick={() => setSortBy('popular')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
            sortBy === 'popular'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Popular
        </button>
      </div>

      {/* Posts */}
      {isLoading && page === 1 ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading posts...</p>
        </div>
      ) : sortedPosts.length === 0 ? (
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

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {isFetching ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
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
