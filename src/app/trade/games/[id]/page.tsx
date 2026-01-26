'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, Clock, Crown, Trophy, Star, Loader2, ArrowLeft, Calendar, Gift } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useTournament, useLeaderboard, useJoinTournament, formatTimeRemaining, shortenAddress } from '@/hooks/useTournaments'
import type { PrizeDistribution } from '@/types'

export default function TournamentDetailPage() {
  const params = useParams()
  const tournamentId = params.id as string
  
  const { address, isConnected } = useAccount()
  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = useTournament(tournamentId, address)
  const { data: leaderboard, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useLeaderboard(tournamentId)
  const joinMutation = useJoinTournament()
  
  // Track if we're calculating scores
  const [calculatingScores, setCalculatingScores] = useState(true)

  // Recalculate scores from settled trades when viewing the tournament
  useEffect(() => {
    if (!tournamentId || !tournament) return
    
    // Only recalculate for live or recently ended tournaments
    if (tournament.status === 'upcoming') {
      setCalculatingScores(false)
      return
    }

    const recalculateScores = async () => {
      setCalculatingScores(true)
      try {
        await fetch(`/api/tournaments/${tournamentId}/calculate-scores`, {
          method: 'POST',
        })
        // Refetch leaderboard after recalculation
        await refetchLeaderboard()
      } catch (error) {
        console.error('Failed to recalculate scores:', error)
      } finally {
        setCalculatingScores(false)
      }
    }

    // Trigger recalculation on page load
    recalculateScores()
  }, [tournamentId, tournament?.status, refetchLeaderboard])

  const handleJoin = async () => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }
    
    try {
      await joinMutation.mutateAsync({ tournamentId, walletAddress: address })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to join tournament')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            LIVE NOW
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            COMING SOON
          </span>
        )
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
            ENDED
          </span>
        )
      default:
        return null
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/20 border-yellow-500/40'
      case 2: return 'bg-gray-400/20 border-gray-400/40'
      case 3: return 'bg-amber-600/20 border-amber-600/40'
      default: return 'bg-white/5 border-white/10'
    }
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '👑'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🎮'
    }
  }

  // Loading state
  if (tournamentLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  // Error state
  if (tournamentError || !tournament) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
        <h1 className="text-xl font-bold text-white mb-2">Tournament Not Found</h1>
        <p className="text-gray-400 mb-6">This tournament doesn&apos;t exist or has been removed.</p>
        <Link 
          href="/trade/games"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </Link>
      </div>
    )
  }

  const userEntry = leaderboard?.find(
    entry => entry.wallet_address.toLowerCase() === address?.toLowerCase()
  )

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Back Button */}
      <Link 
        href="/trade/games"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Games</span>
      </Link>

      {/* Tournament Header Card */}
      <div 
        className={`backdrop-blur-sm border rounded-2xl p-6 mb-6 ${
          tournament.status === 'live' ? 'border-green-500/30' : 
          tournament.status === 'ended' ? 'border-gray-500/30' :
          'border-yellow-500/30'
        }`}
        style={{ background: 'rgba(26,26,26,0.9)' }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
            tournament.status === 'live' 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
              : 'bg-gray-800/50 border border-gray-700/50'
          }`}>
            {tournament.emoji}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{tournament.name}</h1>
            {getStatusBadge(tournament.status)}
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <p className="text-gray-400 mb-6">{tournament.description}</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xl font-bold text-yellow-400">{tournament.prize_pool}</div>
            <div className="text-xs text-gray-500 uppercase">Prize Pool</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-center gap-1 text-white">
              <Users className="w-4 h-4" />
              <span className="font-bold">{tournament.participant_count}</span>
            </div>
            <div className="text-xs text-gray-500 uppercase">Participants</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-center gap-1 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-bold text-sm">
                {tournament.status === 'live' 
                  ? formatTimeRemaining(tournament.end_date)
                  : tournament.status === 'upcoming'
                  ? formatTimeRemaining(tournament.start_date)
                  : 'Ended'
                }
              </span>
            </div>
            <div className="text-xs text-gray-500 uppercase">
              {tournament.status === 'live' ? 'Ends In' : tournament.status === 'upcoming' ? 'Starts In' : 'Status'}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Start: {new Date(tournament.start_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>End: {new Date(tournament.end_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Join Button */}
        {(tournament.status === 'live' || tournament.status === 'upcoming') && (
          <div>
            {tournament.user_joined ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-green-400">
                  <span className="text-lg">✓</span>
                  <span className="font-medium">You&apos;re in!</span>
                </div>
                {tournament.user_rank && (
                  <span className="text-yellow-400 font-bold">Rank #{tournament.user_rank}</span>
                )}
              </div>
            ) : (
              <button 
                onClick={handleJoin}
                disabled={joinMutation.isPending || !isConnected}
                className="w-full text-lg font-semibold text-white py-4 rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #22c55e, #10b981)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}
              >
                {joinMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : !isConnected ? (
                  'Connect Wallet to Join'
                ) : (
                  'Join Tournament'
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Prize Distribution */}
      {tournament.prize_distribution && tournament.prize_distribution.length > 0 && (
        <div 
          className="backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(26,26,26,0.9)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Prize Distribution</h2>
          </div>

          <div className="space-y-3">
            {tournament.prize_distribution.map((prize: PrizeDistribution) => (
              <div 
                key={prize.rank}
                className={`flex items-center justify-between p-4 rounded-xl border ${getRankStyle(prize.rank)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getRankEmoji(prize.rank)}</span>
                  <span className="text-white font-medium">
                    {prize.rank === 1 ? '1st Place' : 
                     prize.rank === 2 ? '2nd Place' : 
                     prize.rank === 3 ? '3rd Place' : 
                     `${prize.rank}th Place`}
                  </span>
                </div>
                <span className="text-xl font-bold text-yellow-400">{prize.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div 
        className="backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6"
        style={{ background: 'rgba(26,26,26,0.9)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Crown className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
          {leaderboard && leaderboard.length > 0 && (
            <span className="text-xs text-gray-500">({leaderboard.length} traders)</span>
          )}
        </div>

        {leaderboardLoading || calculatingScores ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            <span className="text-xs text-gray-500">{calculatingScores ? 'Updating scores...' : 'Loading leaderboard...'}</span>
          </div>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Crown className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No rankings yet</p>
            <p className="text-sm text-gray-500 mt-1">Join and start trading to appear here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div 
                key={player.wallet_address}
                className={`flex items-center p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                  index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                  index === 1 ? 'bg-gray-500/10 border-gray-500/30' :
                  index === 2 ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-white/5 border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-sm font-bold ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-black' :
                  index === 2 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' :
                  'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {player.rank}
                </div>
                <div className="text-2xl mr-4">{getRankEmoji(player.rank)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{shortenAddress(player.wallet_address)}</div>
                  <div className="text-xs text-gray-500">
                    {player.trade_count} trades • {player.streak_days}d streak
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400">{player.score.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-500 uppercase">points</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Stats (if not in top leaderboard but joined) */}
        {isConnected && address && tournament.user_joined && userEntry && userEntry.rank > 10 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-medium text-white">You</span>
                  <div className="text-xs text-gray-500">{userEntry.trade_count} trades</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-400">#{userEntry.rank}</span>
                <div className="text-xs text-gray-500">{userEntry.score.toFixed(2)} pts</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
