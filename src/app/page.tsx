'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Menu, X } from 'lucide-react'

const Homepage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 text-gray-800">
      {/* Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-yellow-100/95 backdrop-blur-sm border-b-4 border-yellow-400' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 border-4 border-yellow-600 flex items-center justify-center" style={{imageRendering: 'pixelated'}}>
                <span className="text-2xl">⭐</span>
              </div>
              <span className="pixel-font text-lg text-purple-700">Optixel</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="pixel-font text-xs hover:text-purple-600 transition-colors">Features</a>
              <Link href="/trade">
                <button className="pixel-font text-xs bg-green-400 hover:bg-green-500 text-white px-6 py-3 border-b-4 border-green-600 hover:border-green-700 active:border-b-0 active:mt-1 transition-all">
                  PLAY NOW!
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-yellow-100 border-t-4 border-yellow-400">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="pixel-font text-xs block py-2 hover:text-purple-600">Features</a>
              <Link href="/trade">
                <button className="pixel-font text-xs w-full bg-green-400 text-white px-6 py-3 border-b-4 border-green-600">
                  PLAY NOW!
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Pixel Art Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Pixel Clouds */}
          <div className="absolute top-20 left-10 w-24 h-12 bg-white rounded-lg opacity-80 float-animation" style={{boxShadow: '8px 8px 0 rgba(200,200,200,0.5)'}}></div>
          <div className="absolute top-32 right-20 w-32 h-16 bg-white rounded-lg opacity-80 float-animation" style={{animationDelay: '1s', boxShadow: '8px 8px 0 rgba(200,200,200,0.5)'}}></div>
          <div className="absolute top-48 left-1/3 w-20 h-10 bg-white rounded-lg opacity-80 float-animation" style={{animationDelay: '2s', boxShadow: '8px 8px 0 rgba(200,200,200,0.5)'}}></div>
          
          {/* Pixel Sun */}
          <div className="absolute top-16 right-16 w-20 h-20 bg-yellow-300 border-4 border-yellow-500" style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            boxShadow: '0 0 60px rgba(255,200,0,0.5)'
          }}></div>
          
          {/* Pixel Stars (scattered) */}
          <div className="absolute top-28 left-1/4 text-3xl bounce-pixel" style={{animationDelay: '0.1s'}}>⭐</div>
          <div className="absolute top-40 right-1/3 text-2xl bounce-pixel" style={{animationDelay: '0.3s'}}>✨</div>
          <div className="absolute top-60 left-1/2 text-3xl bounce-pixel" style={{animationDelay: '0.5s'}}>💫</div>
          
          {/* Pixel Ground/Grass at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-400 to-green-300" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #4ade80 0px, #4ade80 20px, #22c55e 20px, #22c55e 40px)'
          }}></div>
          
          {/* Pixel Trees */}
          <div className="absolute bottom-20 left-10 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[40px] border-l-transparent border-r-transparent border-b-green-600"></div>
            <div className="w-4 h-8 bg-amber-700"></div>
          </div>
          <div className="absolute bottom-24 right-16 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[50px] border-l-transparent border-r-transparent border-b-green-600"></div>
            <div className="w-5 h-10 bg-amber-700"></div>
          </div>
          
          {/* Floating Coins */}
          <div className="absolute top-1/3 left-20 text-4xl float-animation" style={{animationDelay: '0.5s'}}>🪙</div>
          <div className="absolute top-1/4 right-24 text-3xl float-animation" style={{animationDelay: '1.5s'}}>🪙</div>
          <div className="absolute top-2/3 left-1/4 text-2xl float-animation" style={{animationDelay: '2.5s'}}>💎</div>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pixel Game-Style Badge */}
          <div className="inline-block mb-8 px-6 py-3 bg-yellow-300 border-4 border-yellow-500 transform -rotate-2">
            <span className="pixel-font text-xs text-yellow-800">NEW GAME AVAILABLE!</span>
          </div>

          {/* Main Headline */}
          <h1 className="pixel-font text-3xl md:text-4xl lg:text-5xl mb-8 leading-relaxed text-purple-800 drop-shadow-lg">
            OPTIONS TRADING
            <br />
            <span className="text-pink-500">MADE FUN & EASY!</span>
          </h1>

          {/* Subheadline */}
          <div className="bg-white/80 backdrop-blur-sm border-4 border-gray-300 p-6 mb-8 max-w-2xl mx-auto" style={{boxShadow: '8px 8px 0 rgba(0,0,0,0.1)'}}>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Forget boring charts! <span className="text-purple-600 font-bold">Swipe left or right</span> to trade options like a game. 
              Our <span className="text-pink-600 font-bold">AI buddy</span> helps you learn, compete in <span className="text-green-600 font-bold">tournaments</span>, and win prizes!
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/trade">
              <button className="group pixel-font text-sm bg-green-500 hover:bg-green-400 text-white px-10 py-5 border-b-8 border-green-700 hover:border-green-600 active:border-b-0 active:mt-2 transition-all transform hover:scale-105" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.3)'}}>
                <span className="flex items-center gap-3">
                  START PLAYING
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <a href="/trade/games">
              <button className="pixel-font text-sm bg-purple-500 hover:bg-purple-400 text-white px-8 py-5 border-b-8 border-purple-700 hover:border-purple-600 active:border-b-0 active:mt-2 transition-all" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.3)'}}>
                <span className="flex items-center gap-2">
                  TOURNAMENTS
                </span>
              </button>
            </a>
          </div>

          {/* Feature Pills - Pixel Style */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="pixel-font text-[8px] px-3 py-2 bg-pink-200 border-2 border-pink-400 text-pink-800">SWIPE TRADE</span>
            <span className="pixel-font text-[8px] px-3 py-2 bg-blue-200 border-2 border-blue-400 text-blue-800">AI HELPER</span>
            <span className="pixel-font text-[8px] px-3 py-2 bg-yellow-200 border-2 border-yellow-400 text-yellow-800">COMPETE</span>
            <span className="pixel-font text-[8px] px-3 py-2 bg-green-200 border-2 border-green-400 text-green-800">MINI GAMES</span>
            <span className="pixel-font text-[8px] px-3 py-2 bg-purple-200 border-2 border-purple-400 text-purple-800">WIN PRIZES</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-green-200 via-yellow-100 to-sky-100">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-3 bg-purple-400 border-4 border-purple-600 mb-6" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.2)'}}>
              <span className="pixel-font text-sm text-white">FEATURES</span>
            </div>
            <h2 className="pixel-font text-2xl md:text-3xl text-purple-800 mb-4">
              HOW IT WORKS
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Trading options has never been this fun! Here&apos;s what makes Optixel special.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Swipe Trade Card */}
            <div className="bg-white border-4 border-pink-400 p-6 transform hover:-translate-y-2 transition-transform" style={{boxShadow: '8px 8px 0 rgba(236,72,153,0.3)'}}>
              <div className="w-16 h-16 bg-pink-400 border-4 border-pink-600 flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">👆</span>
              </div>
              <h3 className="pixel-font text-sm text-pink-600 text-center mb-4">SWIPE TRADE</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Forget complex order books! Simply <strong>swipe right to buy</strong> or <strong>swipe left to pass</strong>. 
                It&apos;s like Tinder, but for options trading!
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <span className="px-2 py-1 bg-pink-100 border-2 border-pink-300 text-pink-600 text-xs">EASY</span>
                <span className="px-2 py-1 bg-pink-100 border-2 border-pink-300 text-pink-600 text-xs">FUN</span>
              </div>
            </div>

            {/* AI Helper Card */}
            <div className="bg-white border-4 border-blue-400 p-6 transform hover:-translate-y-2 transition-transform" style={{boxShadow: '8px 8px 0 rgba(59,130,246,0.3)'}}>
              <div className="w-16 h-16 bg-blue-400 border-4 border-blue-600 flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="pixel-font text-sm text-blue-600 text-center mb-4">AI HELPER</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Your personal AI buddy explains options in <strong>simple language</strong>. 
                Ask anything - no question is too basic! Learn as you play.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <span className="px-2 py-1 bg-blue-100 border-2 border-blue-300 text-blue-600 text-xs">SMART</span>
                <span className="px-2 py-1 bg-blue-100 border-2 border-blue-300 text-blue-600 text-xs">24/7</span>
              </div>
            </div>

            {/* Tournaments Card */}
            <div className="bg-white border-4 border-yellow-400 p-6 transform hover:-translate-y-2 transition-transform" style={{boxShadow: '8px 8px 0 rgba(234,179,8,0.3)'}}>
              <div className="w-16 h-16 bg-yellow-400 border-4 border-yellow-600 flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="pixel-font text-sm text-yellow-600 text-center mb-4">TOURNAMENTS</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Compete with other players in <strong>weekly tournaments</strong>! 
                Climb the leaderboard and win real prizes. May the best trader win!
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <span className="px-2 py-1 bg-yellow-100 border-2 border-yellow-300 text-yellow-600 text-xs">WEEKLY</span>
                <span className="px-2 py-1 bg-yellow-100 border-2 border-yellow-300 text-yellow-600 text-xs">PRIZES</span>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Link href="/trade">
              <button className="pixel-font text-xs bg-green-500 hover:bg-green-400 text-white px-8 py-4 border-b-4 border-green-700 hover:border-green-600 active:border-b-0 active:mt-1 transition-all" style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.2)'}}>
                TRY IT NOW - IT&apos;S FREE!
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-800 border-t-4 border-purple-600 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center">
              <span className="text-sm">⭐</span>
            </div>
            <span className="pixel-font text-xs text-white">OPTIXEL</span>
          </div>
          <p className="text-purple-200 text-sm mb-2">
            Built with ❤️ and powered by <strong className="text-yellow-300">Thetanuts Finance</strong>
          </p>
          <p className="pixel-font text-[8px] text-purple-300">
            © 2025 OPTIXEL - MAKING OPTIONS TRADING FUN!
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Homepage