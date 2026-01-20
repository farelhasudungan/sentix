import type {
  Tournament,
  TournamentWithStats,
  TournamentParticipant,
  TournamentScore,
  LeaderboardEntry,
} from '@/types';

const API_BASE = '/api/tournaments';

/**
 * Fetch all tournaments with participant counts
 */
export async function fetchTournaments(): Promise<TournamentWithStats[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch tournaments');
  }
  return response.json();
}

/**
 * Fetch a single tournament by ID
 */
export async function fetchTournament(id: string): Promise<TournamentWithStats> {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tournament');
  }
  return response.json();
}

/**
 * Join a tournament
 */
export async function joinTournament(
  tournamentId: string,
  walletAddress: string
): Promise<TournamentParticipant> {
  const response = await fetch(`${API_BASE}/${tournamentId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join tournament');
  }
  return response.json();
}

/**
 * Get tournament leaderboard
 */
export async function fetchLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${API_BASE}/${tournamentId}/leaderboard`);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
}

/**
 * Check if user has joined a tournament
 */
export async function checkParticipation(
  tournamentId: string,
  walletAddress: string
): Promise<boolean> {
  const response = await fetch(
    `${API_BASE}/${tournamentId}/participation?wallet=${walletAddress}`
  );
  if (!response.ok) return false;
  const data = await response.json();
  return data.joined;
}

/**
 * Record a trade for tournament scoring
 */
export async function recordTrade(
  tournamentId: string,
  walletAddress: string,
  tradeData: {
    premiumPaid: number;
    profit: number;
  }
): Promise<TournamentScore> {
  const response = await fetch(`${API_BASE}/${tournamentId}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, ...tradeData }),
  });
  if (!response.ok) {
    throw new Error('Failed to record trade');
  }
  return response.json();
}

// Admin functions

/**
 * Create a new tournament (admin only)
 */
export async function createTournament(
  tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'status'>,
  adminWallet: string
): Promise<Tournament> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Wallet': adminWallet,
    },
    body: JSON.stringify(tournament),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tournament');
  }
  return response.json();
}

/**
 * Update a tournament (admin only)
 */
export async function updateTournament(
  id: string,
  updates: Partial<Tournament>,
  adminWallet: string
): Promise<Tournament> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Wallet': adminWallet,
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tournament');
  }
  return response.json();
}

/**
 * Delete a tournament (admin only)
 */
export async function deleteTournament(
  id: string,
  adminWallet: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Wallet': adminWallet },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tournament');
  }
}
