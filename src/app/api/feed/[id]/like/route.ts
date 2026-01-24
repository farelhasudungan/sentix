import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /api/feed/[id]/like - Like a post
export async function POST(
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

    // Check if post exists
    const { data: post } = await supabase
      .from('feed_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create like (upsert to handle duplicates gracefully)
    const { error } = await supabase
      .from('feed_likes')
      .upsert(
        {
          post_id: id,
          wallet_address: wallet_address.toLowerCase(),
        },
        { onConflict: 'post_id,wallet_address' }
      );

    if (error) {
      console.error('Error liking post:', error);
      return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in like POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/feed/[id]/like - Unlike a post
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

    const { error } = await supabase
      .from('feed_likes')
      .delete()
      .eq('post_id', id)
      .eq('wallet_address', wallet_address.toLowerCase());

    if (error) {
      console.error('Error unliking post:', error);
      return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in like DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
