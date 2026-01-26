import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { REFERRER_ADDRESS, INDEXER_BASE_URL } from '@/lib/constants'
import { SCORING_WEIGHTS } from '@/types'
import { formatUnits } from 'viem'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface SettledPosition {
  address: string
  entryPremium: string
  numContracts: string
  collateralDecimals: number
  expiryTimestamp: number
  entryTimestamp: number
  referrer: string
  status: string
  settlement?: {
    payoutBuyer: string
    settlementPrice: string
  }
}

/**
 * Calculate score based on SETTLED trades:
 * - Premium Paid: 40%
 * - Profit Ratio: 30% (actual profit from settlement)
 * - Trade Count: 20%
 * - Streak Days: 10%
 */
function calculateScore(
  totalPremium: number,
  totalProfit: number,
  tradeCount: number,
  streakDays: number
): number {
  const normalizedPremium = Math.min(totalPremium / 1000, 100) // Max 100 points for $1000+ premium
  const profitRatio = totalPremium > 0 ? totalProfit / totalPremium : 0
  const normalizedProfit = Math.max(0, Math.min(profitRatio * 100, 100))
  const normalizedTrades = Math.min(Math.sqrt(tradeCount) * 5, 100)
  const normalizedStreak = Math.min(Math.sqrt(streakDays) * 10, 100)

  const score =
    normalizedPremium * SCORING_WEIGHTS.premiumPaid +
    normalizedProfit * SCORING_WEIGHTS.profitRatio +
    normalizedTrades * SCORING_WEIGHTS.tradeCount +
    normalizedStreak * SCORING_WEIGHTS.streakDays

  return Math.round(score * 100) / 100
}

/**
 * POST /api/tournaments/[id]/calculate-scores
 * Recalculate all scores for a tournament based on settled trades
 * This called when leaderboard is viewed
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    const tournamentStart = new Date(tournament.start_date).getTime() / 1000
    const tournamentEnd = new Date(tournament.end_date).getTime() / 1000

    // Get all participants
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('wallet_address')
      .eq('tournament_id', id)

    if (!participants || participants.length === 0) {
      return NextResponse.json({ message: 'No participants to update', updated: 0 })
    }

    let updatedCount = 0

    // Process each participant
    for (const participant of participants) {
      const wallet = participant.wallet_address

      try {
        // Fetch settled history from indexer
        const response = await fetch(`${INDEXER_BASE_URL}/user/${wallet}/history`)
        if (!response.ok) continue

        const history: SettledPosition[] = await response.json()

        // Filter: 
        // 1. Only our platform's trades (referrer)
        // 2. Only settled trades
        // 3. Only trades that SETTLED during tournament period
        const relevantTrades = history.filter(p => {
          const isOurPlatform = p.referrer?.toLowerCase() === REFERRER_ADDRESS.toLowerCase()
          const isSettled = p.status === 'settled' && p.settlement
          const expiryTime = p.expiryTimestamp
          const settledDuringTournament = expiryTime >= tournamentStart && expiryTime <= tournamentEnd
          
          return isOurPlatform && isSettled && settledDuringTournament
        })

        // Calculate totals from settled trades
        let totalPremium = 0
        let totalPayout = 0
        const tradeDates = new Set<string>()

        for (const trade of relevantTrades) {
          const decimals = trade.collateralDecimals || 6
          const premium = parseFloat(formatUnits(BigInt(trade.entryPremium), decimals))
          const payoutBuyerRaw = trade.settlement?.payoutBuyer
          const payout = payoutBuyerRaw 
            ? parseFloat(formatUnits(BigInt(payoutBuyerRaw), decimals))
            : 0

          totalPremium += premium
          totalPayout += payout

          // Track unique trade days for streak calculation
          const tradeDate = new Date(trade.entryTimestamp * 1000).toISOString().split('T')[0]
          tradeDates.add(tradeDate)
        }

        const totalProfit = totalPayout - totalPremium
        const tradeCount = relevantTrades.length

        // Calculate streak days from trade dates
        const sortedDates = Array.from(tradeDates).sort()
        let streakDays = 0
        let currentStreak = 0
        
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            currentStreak = 1
          } else {
            const prevDate = new Date(sortedDates[i - 1])
            const currDate = new Date(sortedDates[i])
            const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 26))
            
            if (diffDays === 1) {
              currentStreak++
            } else {
              currentStreak = 1
            }
          }
          streakDays = Math.max(streakDays, currentStreak)
        }

        // Calculate score
        const score = calculateScore(totalPremium, totalProfit, tradeCount, streakDays)

        // Update or insert score
        const { error: upsertError } = await supabase
          .from('tournament_scores')
          .upsert({
            tournament_id: id,
            wallet_address: wallet,
            total_premium_paid: totalPremium,
            total_profit: totalProfit,
            trade_count: tradeCount,
            streak_days: streakDays,
            score: score,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'tournament_id,wallet_address'
          })

        if (!upsertError) updatedCount++

      } catch (err) {
        console.error(`Failed to process ${wallet}:`, err)
      }
    }

    // Update ranks for all participants
    const { data: scores } = await supabase
      .from('tournament_scores')
      .select('id, score')
      .eq('tournament_id', id)
      .order('score', { ascending: false })

    if (scores) {
      for (let i = 0; i < scores.length; i++) {
        await supabase
          .from('tournament_scores')
          .update({ rank: i + 1 })
          .eq('id', scores[i].id)
      }
    }

    return NextResponse.json({
      message: 'Scores recalculated from settled trades',
      updated: updatedCount,
      total: participants.length
    })

  } catch (error) {
    console.error('Error calculating scores:', error)
    return NextResponse.json(
      { error: 'Failed to calculate scores' },
      { status: 500 }
    )
  }
}
