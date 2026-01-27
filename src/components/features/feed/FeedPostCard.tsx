'use client'

import React, { useState } from 'react'
import { Heart, MessageCircle, Share2, Trash2, X, AlertTriangle, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import type { FeedPost } from '@/types'
import { TradeAttachmentCard } from './TradeAttachmentCard'
import { FeedCommentSection } from './FeedCommentSection'
import { likePost, unlikePost, generateShareLink, formatRelativeTime, truncateAddress } from '@/lib/api/feed'
import { useUserAlias } from '@/hooks/useUserAlias'

interface FeedPostCardProps {
  post: FeedPost
  onLikeChange?: (postId: string, liked: boolean, newCount: number) => void
  onDelete?: (postId: string) => void
}

// Helper component for displaying post author with alias support
function PostAuthorDisplay({ walletAddress, createdAt }: { walletAddress: string; createdAt: string }) {
  const { displayName, isCustomAlias } = useUserAlias(walletAddress)
  
  // Generate avatar color from wallet address
  const hash = walletAddress.slice(2, 10)
  const hue = parseInt(hash, 16) % 360
  const gradient = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 40) % 360}, 70%, 40%))`
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: gradient, color: '#fff' }}
      >
        {walletAddress.slice(2, 4).toUpperCase()}
      </div>
      <div>
        <p 
          className="font-medium text-sm"
          style={{ color: isCustomAlias ? '#fbbf24' : '#fff' }}
          title={walletAddress}
        >
          {displayName}
        </p>
        <p className="text-gray-500 text-xs">
          {formatRelativeTime(createdAt)}
        </p>
      </div>
    </div>
  )
}

export function FeedPostCard({ post, onLikeChange, onDelete }: FeedPostCardProps) {
  const { address } = useAccount()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.user_liked || false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comment_count)
  const [isLiking, setIsLiking] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = address?.toLowerCase() === post.wallet_address.toLowerCase()

  const handleLike = async () => {
    if (!address || isLiking) return
    
    setIsLiking(true)
    const wasLiked = isLiked
    const prevCount = likeCount

    // Optimistic update
    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)

    try {
      if (wasLiked) {
        await unlikePost(post.id, address)
      } else {
        await likePost(post.id, address)
      }
      onLikeChange?.(post.id, !wasLiked, wasLiked ? prevCount - 1 : prevCount + 1)
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked)
      setLikeCount(prevCount)
      console.error('Failed to toggle like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    const link = generateShareLink(post.id)
    
    try {
      await navigator.clipboard.writeText(link)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } catch {
      // Fallback for older browsers
      window.open(link, '_blank')
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    onDelete?.(post.id)
    // Keep modal open briefly to show loading state
    setTimeout(() => {
      setShowDeleteConfirm(false)
      setIsDeleting(false)
    }, 500)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div 
        className="rounded-2xl p-5 border border-white/10 transition-all"
        style={{ background: 'rgba(26,26,26,0.8)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <PostAuthorDisplay 
            walletAddress={post.wallet_address} 
            createdAt={post.created_at} 
          />
          
          {isOwner && (
            <button
              onClick={handleDeleteClick}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-white text-sm leading-relaxed mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Attached Trade */}
        {post.attached_trade && (
          <div className="mb-4">
            <TradeAttachmentCard trade={post.attached_trade} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
          <button
            onClick={handleLike}
            disabled={!address || isLiking}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              isLiked 
                ? 'text-red-400 bg-red-500/10' 
                : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
            } ${(!address || isLiking) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{commentCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all relative"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
            
            {showShareToast && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap">
                Link copied!
              </div>
            )}
          </button>

          <button
            onClick={() => {
              const encodedContent = encodeURIComponent(post.content)
              router.push(`/trade/agent?analyze=${encodedContent}`)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all ml-auto"
            title="Analyze with AI"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Analyze</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <FeedCommentSection 
            postId={post.id} 
            onCommentCountChange={(count: number) => setCommentCount(count)}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={handleDeleteCancel}
        >
          <div 
            className="w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'linear-gradient(180deg, rgba(38,38,38,0.98) 0%, rgba(26,26,26,0.99) 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Post</h3>
              </div>
              <button
                onClick={handleDeleteCancel}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-gray-300 text-sm mb-1">
                Are you sure you want to delete this post?
              </p>
              <p className="text-gray-500 text-xs">
                This action cannot be undone. All comments will also be removed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 pt-0">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
