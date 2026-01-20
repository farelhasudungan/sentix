'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTournaments,
  fetchTournament,
  fetchLeaderboard,
  joinTournament,
  recordTrade,
} from '@/lib/api/tournaments'
import type { TournamentWithStats, LeaderboardEntry, TournamentScore } from '@/types'

/**
 * Hook to fetch all tournaments
 */
export function useTournaments(walletAddress?: string) {
  return useQuery<TournamentWithStats[]>({
    queryKey: ['tournaments', walletAddress],
    queryFn: async () => {
      const url = walletAddress 
        ? `/api/tournaments?wallet=${walletAddress}` 
        : '/api/tournaments'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch tournaments')
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch a single tournament
 */
export function useTournament(id: string, walletAddress?: string) {
  return useQuery<TournamentWithStats>({
    queryKey: ['tournament', id, walletAddress],
    queryFn: async () => {
      const url = walletAddress 
        ? `/api/tournaments/${id}?wallet=${walletAddress}` 
        : `/api/tournaments/${id}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch tournament')
      return response.json()
    },
    enabled: !!id,
  })
}

/**
 * Hook to fetch tournament leaderboard
 */
export function useLeaderboard(tournamentId: string) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', tournamentId],
    queryFn: () => fetchLeaderboard(tournamentId),
    enabled: !!tournamentId,
    staleTime: 10 * 1000, // 10 seconds
  })
}

/**
 * Hook to join a tournament
 */
export function useJoinTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tournamentId, walletAddress }: { tournamentId: string; walletAddress: string }) =>
      joinTournament(tournamentId, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['tournament'] })
    },
  })
}

/**
 * Hook to record a trade for tournament scoring
 */
export function useRecordTrade() {
  const queryClient = useQueryClient()

  return useMutation<
    TournamentScore,
    Error,
    { tournamentId: string; walletAddress: string; premiumPaid: number; profit: number }
  >({
    mutationFn: ({ tournamentId, walletAddress, premiumPaid, profit }) =>
      recordTrade(tournamentId, walletAddress, { premiumPaid, profit }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard', variables.tournamentId] })
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}

/**
 * Helper to format time remaining
 */
export function formatTimeRemaining(dateString: string): string {
  const targetDate = new Date(dateString)
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) return 'Ended'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  }
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

/**
 * Helper to shorten wallet address
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
