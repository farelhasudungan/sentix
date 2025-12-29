'use client'

import React, { useState } from 'react'
import { Users, Clock, Crown } from 'lucide-react'

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
    <div className="px-4 py-6 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="pixel-font text-xl text-purple-800 mb-2">GAME CENTER</h1>
          <p className="text-gray-600 text-sm">Compete, Win, Earn! 🏆</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 pixel-font text-[10px] py-3 border-4 transition-all ${
              activeTab === 'tournaments' 
                ? 'bg-yellow-400 text-yellow-800 border-yellow-600' 
                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
            }`}
          >
            🎮 TOURNAMENTS
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 pixel-font text-[10px] py-3 border-4 transition-all ${
              activeTab === 'leaderboard' 
                ? 'bg-yellow-400 text-yellow-800 border-yellow-600' 
                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
            }`}
          >
            🏆 LEADERBOARD
          </button>
        </div>

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <div 
                key={tournament.id}
                className={`bg-white border-4 p-4 transition-all hover:-translate-y-1 ${
                  tournament.status === 'LIVE' ? 'border-green-400' : 'border-gray-300'
                }`}
                style={{boxShadow: '6px 6px 0 rgba(0,0,0,0.1)'}}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 border-4 flex items-center justify-center text-2xl ${
                      tournament.status === 'LIVE' 
                        ? 'bg-green-400 border-green-600' 
                        : 'bg-gray-300 border-gray-400'
                    }`}>
                      {tournament.emoji}
                    </div>
                    <div>
                      <h3 className="pixel-font text-xs text-gray-800">{tournament.name}</h3>
                      <div className={`pixel-font text-[8px] mt-1 px-2 py-0.5 inline-block ${
                        tournament.status === 'LIVE' 
                          ? 'bg-green-100 text-green-700 border border-green-400' 
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}>
                        {tournament.status === 'LIVE' ? '🔴 LIVE' : '⏳ SOON'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="pixel-font text-sm text-yellow-600">{tournament.prize}</div>
                    <div className="text-[10px] text-gray-400">PRIZE POOL</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{tournament.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {tournament.participants}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tournament.status === 'LIVE' ? `Ends: ${tournament.endsIn}` : `Starts: ${tournament.startsIn}`}
                    </span>
                  </div>
                  
                  {tournament.status === 'LIVE' ? (
                    <button className="pixel-font text-[8px] bg-green-500 hover:bg-green-400 text-white px-4 py-2 border-b-2 border-green-700 transition-all">
                      JOIN NOW
                    </button>
                  ) : (
                    <button className="pixel-font text-[8px] bg-gray-400 text-white px-4 py-2 border-b-2 border-gray-600">
                      NOTIFY ME
                    </button>
                  )}
                </div>

                {tournament.yourRank && (
                  <div className="mt-3 pt-3 border-t-2 border-gray-200">
                    <span className="text-xs text-gray-500">Your Rank: </span>
                    <span className="pixel-font text-xs text-purple-600">#{tournament.yourRank}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white border-4 border-yellow-400 p-4" style={{boxShadow: '6px 6px 0 rgba(0,0,0,0.1)'}}>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="pixel-font text-xs text-gray-800">TOP TRADERS</span>
            </div>

            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <div 
                  key={player.rank}
                  className={`flex items-center p-3 border-2 ${
                    index === 0 ? 'bg-yellow-50 border-yellow-400' :
                    index === 1 ? 'bg-gray-50 border-gray-400' :
                    index === 2 ? 'bg-orange-50 border-orange-400' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 border-2 flex items-center justify-center mr-3 ${
                    index === 0 ? 'bg-yellow-400 border-yellow-600 text-white' :
                    index === 1 ? 'bg-gray-400 border-gray-600 text-white' :
                    index === 2 ? 'bg-orange-400 border-orange-600 text-white' :
                    'bg-gray-200 border-gray-400 text-gray-600'
                  }`}>
                    <span className="pixel-font text-[10px]">{player.rank}</span>
                  </div>
                  <div className="text-2xl mr-3">{player.avatar}</div>
                  <div className="flex-1">
                    <div className="pixel-font text-[10px] text-gray-800">{player.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="pixel-font text-xs text-purple-600">{player.score.toLocaleString()}</div>
                    <div className="text-[8px] text-gray-400">POINTS</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Your Stats */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center justify-between bg-purple-50 border-2 border-purple-400 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎮</span>
                  <span className="pixel-font text-[10px] text-gray-800">YOU</span>
                </div>
                <div className="text-right">
                  <span className="pixel-font text-xs text-purple-600">#42</span>
                  <span className="text-[10px] text-gray-400 ml-2">2,340 pts</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
