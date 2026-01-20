import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/tournaments/[id]/join - Join a tournament
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const wallet = walletAddress.toLowerCase()

    // Check if tournament exists and is live or upcoming
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('start_date, end_date')
      .eq('id', id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const endDate = new Date(tournament.end_date)

    if (now > endDate) {
      return NextResponse.json(
        { error: 'Tournament has ended' },
        { status: 400 }
      )
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', id)
      .eq('wallet_address', wallet)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already joined this tournament' },
        { status: 400 }
      )
    }

    // Join the tournament
    const { data: participant, error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: id,
        wallet_address: wallet,
      })
      .select()
      .single()

    if (error) throw error

    // Initialize score entry
    await supabase
      .from('tournament_scores')
      .insert({
        tournament_id: id,
        wallet_address: wallet,
        total_premium_paid: 0,
        total_profit: 0,
        trade_count: 0,
        streak_days: 0,
        score: 0,
      })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error('Error joining tournament:', error)
    return NextResponse.json(
      { error: 'Failed to join tournament' },
      { status: 500 }
    )
  }
}
