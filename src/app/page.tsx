'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Users, Trophy, Sparkles, Zap, Target, Crown } from 'lucide-react'

const Homepage = () => {
  const features = [
    {
      title: 'Swipe to Trade',
      description: 'Swipe right to buy options, left to pass. Trading has never been this fun!',
      icon: '👆',
      color: 'from-green-500/20 to-emerald-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'AI Trading Buddy',
      description: 'Your personal AI explains options in simple terms. No jargon!',
      icon: '🤖',
      color: 'from-blue-500/20 to-cyan-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Tournaments',
      description: 'Compete with other traders and win real prizes!',
      icon: '🏆',
      color: 'from-amber-500/20 to-yellow-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      title: 'Track & Earn',
      description: 'Monitor your trades with beautiful P&L tracking.',
      icon: '📊',
      color: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-500/30',
    },
  ]

  const stats = [
    { label: 'Active Players', value: '10K+', icon: Users },
    { label: 'Total Trades', value: '50K+', icon: Target },
    { label: 'Prize Pool', value: '$25K', icon: Trophy },
  ]

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#141414' }}>
      {/* Animated Clouds Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 left-[10%] w-64 h-32 opacity-5 animate-pulse" style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.3), transparent 70%)', animation: 'float 20s ease-in-out infinite' }} />
        <div className="absolute top-40 right-[5%] w-48 h-24 opacity-5" style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.2), transparent 70%)', animation: 'float 25s ease-in-out infinite reverse' }} />
        <div className="absolute bottom-40 left-[20%] w-56 h-28 opacity-5" style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.25), transparent 70%)', animation: 'float 22s ease-in-out infinite' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 px-6 py-6">
        <div className="relative max-w-6xl mx-auto rounded-full px-6 py-4 overflow-hidden" style={{ boxShadow: '0 6px 6px rgba(0,0,0,0.2), 0 0 20px rgba(0,0,0,0.1)' }}>
          <div className="absolute inset-0 backdrop-blur-xl bg-white/5" style={{ borderRadius: 'inherit' }} />
          <div className="absolute inset-0 bg-white/10" style={{ borderRadius: 'inherit' }} />
          <div className="absolute inset-0 overflow-hidden" style={{ boxShadow: 'inset 2px 2px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 1px 1px rgba(255,255,255,0.2)', borderRadius: 'inherit' }} />
          
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)' }}>
                <span className="text-base">⭐</span>
              </div>
              <span className="font-semibold text-lg text-white pixel-font">Sentix</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-base font-semibold text-gray-300 hover:text-white transition-colors" style={{ textShadow: '1px 0 4px rgba(0,0,0,0.7)' }}>Features</a>
              <a href="#how-it-works" className="text-base font-semibold text-gray-300 hover:text-white transition-colors" style={{ textShadow: '1px 0 4px rgba(0,0,0,0.7)' }}>How It Works</a>
              
              <Link href="/trade">
                <div className="pixel-button-gold">
                  <span className="pixel-button-label">Play Now</span>
                </div>
              </Link>
            </div>

            <Link href="/trade" className="md:hidden">
              <div className="pixel-button-gold-sm">
                <span className="pixel-button-label text-sm">Play</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Pixel Art Style */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4">
        {/* Gradient Glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.1) 0%, transparent 50%)' }} />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Pixel Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)' }}>
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">A New Type of Trading Game</span>
          </div>

          {/* Main Heading with Pixel Style Shadow */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block" style={{ 
              background: 'linear-gradient(to bottom, #ffffff, #d4d4d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 0 rgba(0,0,0,0.3)'
            }}>
              Swipe. Trade.
            </span>
            <span className="block" style={{ 
              background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Win Big!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Make your home in a world of unlimited trading adventure. 
            Master options and compete with friends. Build your portfolio.
          </p>

          {/* CTA Buttons with Pixel Style */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/trade">
              <div className="pixel-button-gold-lg">
                <span className="pixel-button-label flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  PLAY FOR FREE
                </span>
              </div>
            </Link>
            <Link href="/trade/games">
              <div className="pixel-button-outline">
                <span className="pixel-button-label-outline">TOURNAMENTS</span>
              </div>
            </Link>
            <Link href="/trade/agent">
              <div className="pixel-button-outline">
                <span className="pixel-button-label-outline">AI BUDDY</span>
              </div>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ticker Banner */}
      <div className="relative overflow-hidden py-4" style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)' }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 text-black font-bold text-sm flex items-center gap-2">
              ⭐ Welcome to Sentix • Trade Options Like a Game • Join Tournaments • Win Prizes
            </span>
          ))}
        </div>
      </div>

      {/* Features Section with Pixel Cards */}
      <section id="features" className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Where Trading
              </span>
              <br />
              <span className="text-white">Comes to Life</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Sentix is building a platform where users can trade options in a fun, gamified experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={`relative p-6 rounded-2xl border ${feature.borderColor} transition-all hover:-translate-y-2 hover:shadow-xl`}
                style={{ background: 'rgba(26,26,26,0.8)' }}
              >
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4 bg-gradient-to-br ${feature.color} border ${feature.borderColor}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/trade">
              <div className="pixel-button-gold inline-block">
                <span className="pixel-button-label">Start Trading</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works with Pixel Style */}
      <section id="how-it-works" className="py-24 px-4" style={{ background: 'linear-gradient(to bottom, rgba(251,191,36,0.05), transparent)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Play With Friends
            </h2>
            <p className="text-gray-400">
              Co-operation makes the world go round. Collaborate or compete!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Connect Wallet', desc: 'Link your crypto wallet to start trading', color: 'bg-green-500' },
              { step: '2', title: 'Swipe Options', desc: 'Browse and swipe to place your trades', color: 'bg-blue-500' },
              { step: '3', title: 'Win Rewards', desc: 'Earn profits and climb the leaderboard', color: 'bg-amber-500' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4`} style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.3)' }}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap / Updates Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(to bottom right, rgba(168,85,247,0.2), rgba(168,85,247,0.05))', border: '2px solid rgba(168,85,247,0.3)' }}>
              <h3 className="text-xl font-bold text-white mb-2">10K+ Players</h3>
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm text-gray-400">Join one of the largest trading game communities!</p>
            </div>
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(to bottom right, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '2px solid rgba(59,130,246,0.3)' }}>
              <h3 className="text-xl font-bold text-white mb-2">Weekly Tournaments</h3>
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-sm text-gray-400">Compete every week for amazing prizes!</p>
            </div>
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(to bottom right, rgba(236,72,153,0.2), rgba(236,72,153,0.05))', border: '2px solid rgba(236,72,153,0.3)' }}>
              <h3 className="text-xl font-bold text-white mb-2">Daily Updates</h3>
              <div className="text-4xl mb-3">🚀</div>
              <p className="text-sm text-gray-400">New features and markets added regularly!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(251,191,36,0.15), rgba(251,191,36,0.05))', border: '2px solid rgba(251,191,36,0.3)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] blur-3xl" style={{ background: 'linear-gradient(to bottom, rgba(251,191,36,0.3), transparent)' }} />
            
            <div className="relative z-10">
              <div className="text-6xl mb-6">🎮</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Start Trading?</h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join thousands of traders who are already using Sentix to trade options the fun way.
              </p>
              <Link href="/trade">
                <div className="pixel-button-gold-lg inline-block">
                  <span className="pixel-button-label">PLAY FOR FREE</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Banner */}
      <div className="relative overflow-hidden py-4" style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)' }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 text-black font-bold text-sm flex items-center gap-2">
              ⭐ Powered by Thetanuts Finance • Trade with Confidence • Learn with AI • Compete to Win
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-4" style={{ background: 'rgba(20,20,20,0.9)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)' }}>
                <span className="text-lg">⭐</span>
              </div>
              <span className="font-bold text-xl text-white">Sentix</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">WHITEPAPER</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">DISCORD</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">TWITTER</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">HELP CENTER</a>
            </div>
          </div>
          
          <div className="text-center border-t border-white/10 pt-8">
            <p className="text-gray-500 text-sm mb-2">
              Built with ❤️ and powered by <span className="text-amber-400 font-semibold">Thetanuts Finance</span>
            </p>
            <p className="text-gray-600 text-xs">
              © 2025 Sentix. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        
        .pixel-button-gold {
          position: relative;
          padding: 12px 24px;
          background: linear-gradient(to bottom, #ffd48d, #b78751);
          border-radius: 12px;
          box-shadow: 0 4px 0 #8b6914, 0 6px 20px rgba(251,191,36,0.3);
          cursor: pointer;
          transition: all 0.1s;
        }
        
        .pixel-button-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #8b6914, 0 8px 25px rgba(251,191,36,0.4);
        }
        
        .pixel-button-gold:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #8b6914, 0 4px 15px rgba(251,191,36,0.2);
        }
        
        .pixel-button-gold-lg {
          position: relative;
          padding: 16px 32px;
          background: linear-gradient(to bottom, #ffd48d, #b78751);
          border-radius: 14px;
          box-shadow: 0 6px 0 #8b6914, 0 8px 25px rgba(251,191,36,0.3);
          cursor: pointer;
          transition: all 0.1s;
        }
        
        .pixel-button-gold-lg:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 0 #8b6914, 0 10px 30px rgba(251,191,36,0.4);
        }
        
        .pixel-button-gold-sm {
          padding: 8px 16px;
          background: linear-gradient(to bottom, #ffd48d, #b78751);
          border-radius: 10px;
          box-shadow: 0 3px 0 #8b6914;
          cursor: pointer;
        }
        
        .pixel-button-label {
          color: #1a1a1a;
          font-weight: 700;
          text-shadow: 0 1px 0 rgba(255,255,255,0.3);
        }
        
        .pixel-button-outline {
          padding: 16px 32px;
          background: transparent;
          border: 2px solid rgba(251,191,36,0.5);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pixel-button-outline:hover {
          background: rgba(251,191,36,0.1);
          border-color: rgba(251,191,36,0.8);
        }
        
        .pixel-button-label-outline {
          color: #fbbf24;
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}

export default Homepage