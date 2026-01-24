import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/feed/[id] - Fetch a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');

  const supabase = getSupabaseAdmin();

  try {
    const { data: post, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get counts
    const { count: likeCount } = await supabase
      .from('feed_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    const { count: commentCount } = await supabase
      .from('feed_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    // Check if user liked
    let userLiked = false;
    if (walletAddress) {
      const { data: like } = await supabase
        .from('feed_likes')
        .select('id')
        .eq('post_id', id)
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();
      userLiked = !!like;
    }

    return NextResponse.json({
      ...post,
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      user_liked: userLiked,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/feed/[id] - Delete a post (only by owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { wallet_address } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: post } = await supabase
      .from('feed_posts')
      .select('wallet_address')
      .eq('id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.wallet_address.toLowerCase() !== wallet_address.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('feed_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
