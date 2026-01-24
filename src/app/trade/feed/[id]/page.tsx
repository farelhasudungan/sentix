'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { fetchPost } from '@/lib/api/feed'
import { FeedPostCard } from '@/components/features/feed/FeedPostCard'

interface SinglePostPageProps {
  params: Promise<{ id: string }>
}

export default function SinglePostPage({ params }: SinglePostPageProps) {
  const { id } = use(params)
  const { address } = useAccount()

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['feed-post', id, address],
    queryFn: () => fetchPost(id, address),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div 
          className="rounded-2xl p-8 text-center border border-white/10"
          style={{ background: 'rgba(26,26,26,0.8)' }}
        >
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-lg font-bold text-white mb-2">Post not found</h2>
          <p className="text-gray-500 text-sm mb-4">
            This post may have been deleted or doesn&apos;t exist.
          </p>
          <Link
            href="/trade/feed"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Back Button */}
      <Link
        href="/trade/feed"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Feed</span>
      </Link>

      {/* Post */}
      <FeedPostCard post={post} />
    </div>
  )
}
