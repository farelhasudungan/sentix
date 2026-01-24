import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/feed - Fetch paginated posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const walletAddress = searchParams.get('wallet');
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  try {
    // Fetch posts with like and comment counts
    const { data: posts, error: postsError, count } = await supabase
      .from('feed_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Get like counts for each post
    const postIds = posts?.map(p => p.id) || [];
    
    const { data: likeCounts } = await supabase
      .from('feed_likes')
      .select('post_id')
      .in('post_id', postIds);

    const { data: commentCounts } = await supabase
      .from('feed_comments')
      .select('post_id')
      .in('post_id', postIds);

    // Check if user has liked posts
    let userLikes: string[] = [];
    if (walletAddress) {
      const { data: likes } = await supabase
        .from('feed_likes')
        .select('post_id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .in('post_id', postIds);
      userLikes = likes?.map(l => l.post_id) || [];
    }

    // Aggregate counts
    const likeCountMap = new Map<string, number>();
    const commentCountMap = new Map<string, number>();
    
    likeCounts?.forEach(l => {
      likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1);
    });
    
    commentCounts?.forEach(c => {
      commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1);
    });

    // Enrich posts with counts
    const enrichedPosts = posts?.map(post => ({
      ...post,
      like_count: likeCountMap.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0,
      user_liked: userLikes.includes(post.id),
    })) || [];

    return NextResponse.json({
      posts: enrichedPosts,
      hasMore: (count || 0) > offset + limit,
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in feed GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/feed - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, wallet_address, attached_trade } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Content exceeds 500 characters' }, { status: 400 });
    }

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: post, error } = await supabase
      .from('feed_posts')
      .insert({
        content: content.trim(),
        wallet_address: wallet_address.toLowerCase(),
        attached_trade: attached_trade || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({
      ...post,
      like_count: 0,
      comment_count: 0,
      user_liked: false,
    });
  } catch (error) {
    console.error('Error in feed POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
