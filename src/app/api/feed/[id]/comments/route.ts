import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/feed/[id]/comments - Fetch comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();

  try {
    const { data: comments, error, count } = await supabase
      .from('feed_comments')
      .select('*', { count: 'exact' })
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({
      comments: comments || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in comments GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/feed/[id]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { content, wallet_address } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 280) {
      return NextResponse.json({ error: 'Comment exceeds 280 characters' }, { status: 400 });
    }

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if post exists
    const { data: post } = await supabase
      .from('feed_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: comment, error } = await supabase
      .from('feed_comments')
      .insert({
        post_id: id,
        content: content.trim(),
        wallet_address: wallet_address.toLowerCase(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error in comments POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/feed/[id]/comments - Delete a comment (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { comment_id, wallet_address } = body;

    if (!comment_id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify comment exists and belongs to user
    const { data: comment } = await supabase
      .from('feed_comments')
      .select('wallet_address')
      .eq('id', comment_id)
      .eq('post_id', id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.wallet_address.toLowerCase() !== wallet_address.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('feed_comments')
      .delete()
      .eq('id', comment_id);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in comments DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
