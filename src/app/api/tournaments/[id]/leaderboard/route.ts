import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/tournaments/[id]/leaderboard - Get tournament leaderboard
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Get all scores for this tournament, ordered by score descending
    const { data: scores, error } = await supabase
      .from('tournament_scores')
      .select('*')
      .eq('tournament_id', id)
      .order('score', { ascending: false })

    if (error) throw error

    // Add ranks
    const leaderboard = (scores || []).map((score, index) => ({
      wallet_address: score.wallet_address,
      score: score.score,
      rank: index + 1,
      total_premium_paid: score.total_premium_paid,
      total_profit: score.total_profit,
      trade_count: score.trade_count,
      streak_days: score.streak_days,
    }))

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
