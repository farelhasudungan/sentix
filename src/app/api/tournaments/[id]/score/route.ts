import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/tournaments/[id]/score - Track a trade (for trade count and streak)
 * Actual profit/loss is calculated via calculate-scores endpoint from settled trades
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { walletAddress, premiumPaid } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const wallet = walletAddress.toLowerCase()
    const today = new Date().toISOString().split('T')[0]

    // Check if user is a participant
    const { data: existing } = await supabase
      .from('tournament_scores')
      .select('*')
      .eq('tournament_id', id)
      .eq('wallet_address', wallet)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'User has not joined this tournament' },
        { status: 400 }
      )
    }

    // Calculate streak
    let newStreak = existing.streak_days
    if (existing.last_trade_date) {
      const lastDate = new Date(existing.last_trade_date)
      const todayDate = new Date(today)
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (diffDays === 1) {
        // Consecutive day - increase streak
        newStreak = existing.streak_days + 1
      } else if (diffDays > 1) {
        // Streak broken - reset to 1
        newStreak = 1
      }
      // If same day, keep streak as is
    } else {
      // First trade
      newStreak = 1
    }

    // Update trade count and streak (profit will be calculated later from settled trades)
    const newTradeCount = existing.trade_count + 1
    const newPremiumPending = (existing.pending_premium || 0) + (premiumPaid || 0)

    const { data: updated, error } = await supabase
      .from('tournament_scores')
      .update({
        trade_count: newTradeCount,
        streak_days: newStreak,
        pending_premium: newPremiumPending,
        last_trade_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('tournament_id', id)
      .eq('wallet_address', wallet)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...updated,
      message: 'Trade tracked. Scores will be updated when trades settle.'
    })
  } catch (error) {
    console.error('Error recording trade:', error)
    return NextResponse.json(
      { error: 'Failed to record trade' },
      { status: 500 }
    )
  }
}
