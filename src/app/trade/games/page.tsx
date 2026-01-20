'use client'

import React from 'react'
import Link from 'next/link'
import { Users, Clock, Gamepad2, Trophy, Loader2, ChevronRight, Gift } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useTournaments, useJoinTournament, formatTimeRemaining } from '@/hooks/useTournaments'
import type { PrizeDistribution } from '@/types'

export default function GamesPage() {
  const { address, isConnected } = useAccount()
  const { data: tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments(address)
  const joinMutation = useJoinTournament()

  const handleJoin = async (e: React.MouseEvent, tournamentId: string) => {
    e.preventDefault() // Prevent link navigation
    e.stopPropagation()
    
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
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            LIVE NOW
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
            COMING SOON
          </span>
        )
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            ENDED
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full mb-4">
          <Gamepad2 className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-medium">Game Center</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Compete & Win</h1>
        <p className="text-gray-400 text-sm">Join tournaments and climb the leaderboard 🏆</p>
      </div>

      {/* Tournaments List */}
      <div className="space-y-4">
        {tournamentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
        ) : tournamentsError ? (
          <div className="text-center py-12 text-gray-400">
            <p>Failed to load tournaments</p>
            <p className="text-sm mt-2">Please check your connection and try again</p>
          </div>
        ) : tournaments?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tournaments available yet</p>
            <p className="text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          tournaments?.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/trade/games/${tournament.id}`}
              className={`block backdrop-blur-sm border rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl group ${
                tournament.status === 'live' ? 'border-green-500/30 hover:border-green-500/50' : 
                tournament.status === 'ended' ? 'border-gray-500/30 hover:border-gray-500/50' :
                'border-white/10 hover:border-yellow-500/30'
              }`}
              style={{ background: 'rgba(26,26,26,0.8)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    tournament.status === 'live' 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
                      : tournament.status === 'ended'
                      ? 'bg-gray-800/50 border border-gray-600/50'
                      : 'bg-gray-800/50 border border-gray-700/50'
                  }`}>
                    {tournament.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg group-hover:text-yellow-400 transition-colors">
                      {tournament.name}
                    </h3>
                    {getStatusBadge(tournament.status)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-yellow-400">{tournament.prize_pool}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Prize Pool</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>

              {/* Prize Distribution Preview */}
              {tournament.prize_distribution && tournament.prize_distribution.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Gift className="w-3.5 h-3.5 text-yellow-400" />
                  {tournament.prize_distribution.slice(0, 3).map((prize: PrizeDistribution) => (
                    <span 
                      key={prize.rank}
                      className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-lg border border-yellow-500/20"
                    >
                      #{prize.rank}: {prize.amount}
                    </span>
                  ))}
                  {tournament.prize_distribution.length > 3 && (
                    <span className="text-xs text-gray-500">+{tournament.prize_distribution.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" />
                    {tournament.participant_count}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    {tournament.status === 'live' 
                      ? `Ends: ${formatTimeRemaining(tournament.end_date)}` 
                      : tournament.status === 'upcoming'
                      ? `Starts: ${formatTimeRemaining(tournament.start_date)}`
                      : 'Ended'
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Join/Status */}
                  {tournament.status === 'live' || tournament.status === 'upcoming' ? (
                    tournament.user_joined ? (
                      <span className="text-xs font-medium text-green-400 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                        ✓ Joined
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => handleJoin(e, tournament.id)}
                        disabled={joinMutation.isPending || !isConnected}
                        className="text-xs font-semibold text-white px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(to right, #22c55e, #10b981)' }}
                      >
                        {joinMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : !isConnected ? (
                          'Connect'
                        ) : (
                          'Join'
                        )}
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-500">View Results</span>
                  )}
                  
                  {/* Arrow indicator */}
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-yellow-400 transition-colors" />
                </div>
              </div>

              {/* User Rank (if joined) */}
              {tournament.user_rank && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Your Current Rank</span>
                  <span className="text-sm font-bold text-yellow-400">#{tournament.user_rank}</span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
