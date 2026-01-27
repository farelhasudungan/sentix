import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { SocialAnalysisPost } from '@/types';

/**
 * GET /api/feed/social-analysis
 * Fetch analyzed social media posts with sentiment and trade suggestions
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sentiment = searchParams.get('sentiment'); // Optional filter
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  try {
    let query = supabase
      .from('social_analysis_posts')
      .select('*', { count: 'exact' })
      .order('posted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply sentiment filter if provided
    if (sentiment && ['bullish', 'bearish', 'neutral'].includes(sentiment)) {
      query = query.eq('sentiment', sentiment);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching social analysis posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts: posts as SocialAnalysisPost[],
      hasMore: (count || 0) > offset + limit,
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in social analysis GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
