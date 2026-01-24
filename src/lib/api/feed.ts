// Feed API utilities
const API_BASE = '/api/feed';

import type { FeedPost, FeedComment, AttachedTrade } from '@/types';

export interface FetchPostsResponse {
  posts: FeedPost[];
  hasMore: boolean;
  total: number;
}

export interface FetchCommentsResponse {
  comments: FeedComment[];
  total: number;
}

/**
 * Fetch paginated feed posts
 */
export async function fetchFeedPosts(
  page: number = 1,
  limit: number = 10,
  walletAddress?: string
): Promise<FetchPostsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (walletAddress) {
    params.append('wallet', walletAddress);
  }

  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  return res.json();
}

/**
 * Fetch a single post by ID
 */
export async function fetchPost(
  postId: string,
  walletAddress?: string
): Promise<FeedPost> {
  const params = walletAddress ? `?wallet=${walletAddress}` : '';
  const res = await fetch(`${API_BASE}/${postId}${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch post');
  }
  return res.json();
}

/**
 * Create a new post
 */
export async function createPost(
  content: string,
  walletAddress: string,
  attachedTrade?: AttachedTrade
): Promise<FeedPost> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      wallet_address: walletAddress,
      attached_trade: attachedTrade || null,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create post');
  }
  return res.json();
}

/**
 * Like a post
 */
export async function likePost(
  postId: string,
  walletAddress: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!res.ok) {
    throw new Error('Failed to like post');
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(
  postId: string,
  walletAddress: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/${postId}/like`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!res.ok) {
    throw new Error('Failed to unlike post');
  }
}

/**
 * Fetch comments for a post
 */
export async function fetchComments(
  postId: string
): Promise<FetchCommentsResponse> {
  const res = await fetch(`${API_BASE}/${postId}/comments`);
  if (!res.ok) {
    throw new Error('Failed to fetch comments');
  }
  return res.json();
}

/**
 * Add a comment to a post
 */
export async function addComment(
  postId: string,
  content: string,
  walletAddress: string
): Promise<FeedComment> {
  const res = await fetch(`${API_BASE}/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      wallet_address: walletAddress,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add comment');
  }
  return res.json();
}

/**
 * Delete a comment (owner only)
 */
export async function deleteComment(
  postId: string,
  commentId: string,
  walletAddress: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/${postId}/comments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comment_id: commentId,
      wallet_address: walletAddress,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete comment');
  }
}

/**
 * Generate a shareable link for a post
 */
export function generateShareLink(postId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/trade/feed/${postId}`;
  }
  return `/trade/feed/${postId}`;
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
