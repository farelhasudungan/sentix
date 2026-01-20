import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, isAdminWallet } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/tournaments/[id] - Get single tournament details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const walletAddress = request.nextUrl.searchParams.get('wallet')?.toLowerCase()

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_participants(count)
      `)
      .eq('id', id)
      .single()

    if (error || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Calculate dynamic status
    const now = new Date()
    const startDate = new Date(tournament.start_date)
    const endDate = new Date(tournament.end_date)
    
    let status: 'upcoming' | 'live' | 'ended' = 'upcoming'
    if (now >= startDate && now <= endDate) {
      status = 'live'
    } else if (now > endDate) {
      status = 'ended'
    }

    // Check user participation
    let userJoined = false
    let userRank = null
    
    if (walletAddress) {
      const { data: participation } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', id)
        .eq('wallet_address', walletAddress)
        .single()
      
      userJoined = !!participation

      if (userJoined) {
        const { data: score } = await supabase
          .from('tournament_scores')
          .select('rank')
          .eq('tournament_id', id)
          .eq('wallet_address', walletAddress)
          .single()
        
        userRank = score?.rank || null
      }
    }

    return NextResponse.json({
      ...tournament,
      status,
      participant_count: tournament.tournament_participants?.[0]?.count || 0,
      user_joined: userJoined,
      user_rank: userRank,
    })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}

// PATCH /api/tournaments/[id] - Update tournament (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const adminWallet = request.headers.get('X-Admin-Wallet')
    
    if (!isAdminWallet(adminWallet || undefined)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    )
  }
}

// DELETE /api/tournaments/[id] - Delete tournament (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const adminWallet = request.headers.get('X-Admin-Wallet')
    
    if (!isAdminWallet(adminWallet || undefined)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    )
  }
}
