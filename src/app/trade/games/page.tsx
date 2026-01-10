'use client'

import React, { useState } from 'react'
import { Users, Clock, Crown, Gamepad2, Trophy, Star } from 'lucide-react'

// Sample tournaments data
const tournaments = [
  {
    id: 1,
    name: 'Weekly ETH Challenge',
    status: 'LIVE',
    prize: '$5,000',
    participants: 234,
    endsIn: '2d 14h',
    description: 'Trade ETH options and climb the leaderboard!',
    yourRank: 42,
    emoji: '🔥',
  },
  {
    id: 2,
    name: 'BTC Moon Mission',
    status: 'LIVE',
    prize: '$10,000',
    participants: 456,
    endsIn: '5d 8h',
    description: 'Predict BTC price movements. Top traders win big!',
    yourRank: 128,
    emoji: '🚀',
  },
  {
    id: 3,
    name: 'Beginner Bootcamp',
    status: 'UPCOMING',
    prize: '$1,000',
    participants: 89,
    startsIn: '1d 2h',
    description: 'New to options? Join this beginner-friendly tournament!',
    yourRank: null,
    emoji: '🌟',
  },
]

const leaderboard = [
  { rank: 1, name: 'CryptoKing', score: 15420, avatar: '👑' },
  { rank: 2, name: 'OptionsWizard', score: 12350, avatar: '🧙' },
  { rank: 3, name: 'DeFiDegen', score: 11200, avatar: '🦄' },
  { rank: 4, name: 'MoonBoy', score: 9870, avatar: '🌙' },
  { rank: 5, name: 'DiamondHands', score: 8540, avatar: '💎' },
]

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leaderboard'>('tournaments')

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setActiveTab('tournaments')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'tournaments' 
              ? 'text-black' 
              : 'text-gray-400 border border-white/10 hover:text-white'
          }`}
          style={activeTab === 'tournaments' 
            ? { background: 'linear-gradient(to right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }
            : { background: 'rgba(255,255,255,0.05)' }
          }
        >
          <Trophy className="w-4 h-4" />
          Tournaments
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'leaderboard' 
              ? 'text-black' 
              : 'text-gray-400 border border-white/10 hover:text-white'
          }`}
          style={activeTab === 'leaderboard' 
            ? { background: 'linear-gradient(to right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }
            : { background: 'rgba(255,255,255,0.05)' }
          }
        >
          <Crown className="w-4 h-4" />
          Leaderboard
        </button>
      </div>

      {/* Tournaments Tab */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <div 
              key={tournament.id}
              className={`backdrop-blur-sm border rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${
                tournament.status === 'LIVE' ? 'border-green-500/30' : 'border-white/10'
              }`}
              style={{ background: 'rgba(26,26,26,0.8)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    tournament.status === 'LIVE' 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
                      : 'bg-gray-800/50 border border-gray-700/50'
                  }`}>
                    {tournament.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{tournament.name}</h3>
                    <div className={`inline-flex items-center gap-1.5 text-xs mt-1 px-2 py-1 rounded-full ${
                      tournament.status === 'LIVE' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                    }`}>
                      {tournament.status === 'LIVE' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                      {tournament.status === 'LIVE' ? 'LIVE NOW' : 'COMING SOON'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-yellow-400">{tournament.prize}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Prize Pool</div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{tournament.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" />
                    {tournament.participants}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    {tournament.status === 'LIVE' ? `Ends: ${tournament.endsIn}` : `Starts: ${tournament.startsIn}`}
                  </span>
                </div>
                
                {tournament.status === 'LIVE' ? (
                  <button 
                    className="text-sm font-semibold text-white px-5 py-2 rounded-xl transition-all"
                    style={{ background: 'linear-gradient(to right, #22c55e, #10b981)', boxShadow: '0 4px 14px rgba(34,197,94,0.2)' }}
                  >
                    Join Now
                  </button>
                ) : (
                  <button className="text-sm font-medium bg-white/5 text-gray-400 px-5 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    Notify Me
                  </button>
                )}
              </div>

              {tournament.yourRank && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Your Rank</span>
                  <span className="text-sm font-bold text-yellow-400">#{tournament.yourRank}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="backdrop-blur-sm border border-amber-500/20 rounded-2xl p-5" style={{ background: 'rgba(26,26,26,0.8)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-white">Top Traders</span>
          </div>

          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div 
                key={player.rank}
                className={`flex items-center p-4 rounded-xl border transition-all hover:scale-[1.02] ${
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
                <div className="text-2xl mr-4">{player.avatar}</div>
                <div className="flex-1">
                  <div className="font-medium text-white">{player.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400">{player.score.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Points</div>
                </div>
              </div>
            ))}
          </div>

          {/* Your Stats */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-white">You</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-400">#42</span>
                <span className="text-sm text-gray-500 ml-3">2,340 pts</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
