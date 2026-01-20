import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, isAdminWallet } from '@/lib/supabase'

// GET /api/tournaments - List all tournaments with participant counts
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const walletAddress = request.nextUrl.searchParams.get('wallet')?.toLowerCase()

    // Fetch tournaments with participant counts
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_participants(count)
      `)
      .order('start_date', { ascending: true })

    if (error) throw error

    // Calculate dynamic status based on dates
    const now = new Date()
    const tournamentsWithStats = await Promise.all(
      (tournaments || []).map(async (t) => {
        const startDate = new Date(t.start_date)
        const endDate = new Date(t.end_date)
        
        let status: 'upcoming' | 'live' | 'ended' = 'upcoming'
        if (now >= startDate && now <= endDate) {
          status = 'live'
        } else if (now > endDate) {
          status = 'ended'
        }

        // Check if user has joined (if wallet provided)
        let userJoined = false
        let userRank = null
        
        if (walletAddress) {
          const { data: participation } = await supabase
            .from('tournament_participants')
            .select('id')
            .eq('tournament_id', t.id)
            .eq('wallet_address', walletAddress)
            .single()
          
          userJoined = !!participation

          if (userJoined) {
            const { data: score } = await supabase
              .from('tournament_scores')
              .select('rank')
              .eq('tournament_id', t.id)
              .eq('wallet_address', walletAddress)
              .single()
            
            userRank = score?.rank || null
          }
        }

        return {
          ...t,
          status,
          participant_count: t.tournament_participants?.[0]?.count || 0,
          user_joined: userJoined,
          user_rank: userRank,
        }
      })
    )

    return NextResponse.json(tournamentsWithStats)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments - Create a new tournament (admin only)
export async function POST(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('X-Admin-Wallet')
    
    if (!isAdminWallet(adminWallet || undefined)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, emoji, prize_pool, start_date, end_date } = body

    if (!name || !prize_pool || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, prize_pool, start_date, end_date' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        description: description || null,
        emoji: emoji || '🏆',
        prize_pool,
        start_date,
        end_date,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}
