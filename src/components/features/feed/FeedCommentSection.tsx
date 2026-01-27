'use client'

import React, { useState, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import type { FeedComment } from '@/types'
import { fetchComments, addComment, deleteComment, formatRelativeTime } from '@/lib/api/feed'
import { useUserAlias, truncateAddress } from '@/hooks/useUserAlias'

interface FeedCommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

// Helper component for displaying comment author with alias support
function CommentAuthorDisplay({ walletAddress }: { walletAddress: string }) {
  const { displayName, isCustomAlias } = useUserAlias(walletAddress)
  
  return (
    <span 
      className="text-xs font-medium"
      style={{ color: isCustomAlias ? '#fbbf24' : '#fff' }}
      title={walletAddress}
    >
      {displayName || truncateAddress(walletAddress)}
    </span>
  )
}

export function FeedCommentSection({ postId, onCommentCountChange }: FeedCommentSectionProps) {
  const { address } = useAccount()
  const [comments, setComments] = useState<FeedComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const { comments: loadedComments, total } = await fetchComments(postId)
      setComments(loadedComments)
      onCommentCountChange?.(total)
    } catch (err) {
      setError('Failed to load comments')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !newComment.trim() || isSubmitting) return

    const content = newComment.trim()
    if (content.length > 280) {
      setError('Comment must be 280 characters or less')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const comment = await addComment(postId, content, address)
      setComments([...comments, comment])
      setNewComment('')
      onCommentCountChange?.(comments.length + 1)
    } catch (err) {
      setError('Failed to add comment')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!address || deletingId) return

    try {
      setDeletingId(commentId)
      setError(null)
      await deleteComment(postId, commentId, address)
      const newComments = comments.filter(c => c.id !== commentId)
      setComments(newComments)
      onCommentCountChange?.(newComments.length)
    } catch (err) {
      setError('Failed to delete comment')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      {/* Comment Input */}
      {address ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            maxLength={280}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <p className="text-gray-500 text-xs text-center mb-4">
          Connect wallet to comment
        </p>
      )}

      {/* Character count */}
      {newComment.length > 0 && (
        <div className={`text-xs mb-2 text-right ${newComment.length > 280 ? 'text-red-400' : 'text-gray-500'}`}>
          {newComment.length}/280
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mb-3">{error}</p>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm py-4">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = address?.toLowerCase() === comment.wallet_address.toLowerCase()
            const isDeleting = deletingId === comment.id
            
            return (
              <div key={comment.id} className="flex gap-3 group">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white'
                  }}
                >
                  {comment.wallet_address.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CommentAuthorDisplay walletAddress={comment.wallet_address} />
                    <span className="text-gray-500 text-[10px]">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        className="ml-auto p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete comment"
                      >
                        <Trash2 className={`w-3 h-3 ${isDeleting ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mt-0.5 break-all">
                    {comment.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
