import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminWallet } from '@/lib/supabase';
import { fetchAllCryptoNews, extractAssetsFromPost, generatePostId, type CryptoPanicPost } from '@/lib/api/cryptopanic';
import { analyzeNewsPost } from '@/lib/api/socialAnalysis';

/**
 * POST /api/feed/social-analysis/sync
 * Sync new crypto news from CryptoPanic and analyze them
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    // Step 1: Fetch news from CryptoPanic
    console.log('Starting CryptoPanic sync...');
    const posts = await fetchAllCryptoNews();

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: 'No news found from CryptoPanic',
        analyzed: 0,
      });
    }

    console.log(`Processing ${posts.length} posts...`);
    let totalAnalyzed = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Step 2: Analyze each post and store in database
    for (const post of posts.slice(0, 10)) { // Limit to 10 to avoid rate limits
      try {
        // Validate post has required fields
        if (!post || !post.title) {
          console.warn('Skipping post without title');
          skipped++;
          continue;
        }

        // Generate unique ID from title + published_at
        const postId = generatePostId(post);
        
        // Check if already exists
        const { data: existing } = await supabase
          .from('social_analysis_posts')
          .select('id')
          .eq('tweet_id', postId)
          .single();

        if (existing) {
          console.log(`Post ${postId} already exists, skipping`);
          skipped++;
          continue;
        }

        // Analyze the news post with AI
        console.log(`Analyzing: "${post.title.substring(0, 50)}..."`);
        const analysis = await analyzeNewsPost(post);
        const assets = extractAssetsFromPost(post);

        // Store in database
        // Note: Developer tier doesn't have source/url, so we use placeholder values
        const { error: insertError } = await supabase
          .from('social_analysis_posts')
          .insert({
            tweet_id: postId,
            account_username: 'cryptopanic.com',
            account_display_name: 'CryptoPanic News',
            content: post.title,
            tweet_url: `https://cryptopanic.com/news/${post.kind}`, // Generic link
            posted_at: post.published_at,
            assets_mentioned: assets,
            sentiment: analysis.sentiment,
            sentiment_confidence: analysis.confidence,
            ai_summary: analysis.summary,
            suggested_trade: analysis.suggestedTrade,
          });

        if (insertError) {
          console.error('Error inserting analyzed news:', insertError);
          errors.push(`Failed to store: ${post.title.substring(0, 30)}`);
        } else {
          totalAnalyzed++;
          console.log(`✓ Stored: ${post.title.substring(0, 50)}...`);
        }
      } catch (postError) {
        console.error(`Error processing post:`, postError);
        errors.push(`Error: ${postError}`);
      }
    }

    console.log(`Sync complete: ${totalAnalyzed} analyzed, ${skipped} skipped`);

    return NextResponse.json({
      message: `Sync complete`,
      analyzed: totalAnalyzed,
      skipped: skipped,
      total_fetched: posts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in social analysis sync:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
