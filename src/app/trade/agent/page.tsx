'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, TrendingUp, Clock, Activity, Bot, Sparkles } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import Image from 'next/image'
import type { Option } from '@/types'

// Import coin icons
import btcIcon from '@/assets/icon/bitcoin.png'
import ethIcon from '@/assets/icon/ethereum.png'
import solIcon from '@/assets/icon/solana.png'
import bnbIcon from '@/assets/icon/binance.png'
import xrpIcon from '@/assets/icon/xrp.png'

const coinIcons: Record<string, typeof btcIcon> = {
  BTC: btcIcon,
  ETH: ethIcon,
  SOL: solIcon,
  BNB: bnbIcon,
  XRP: xrpIcon,
}

const MiniOptionCard = ({ option }: { option: Option }) => (
  <div className="border border-amber-500/30 rounded-xl p-4 mt-3 w-full max-w-sm" style={{ background: 'rgba(26,26,26,0.9)' }}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-800/50 border border-gray-700/50 rounded-xl">
          {coinIcons[option.asset] ? (
            <Image 
              src={coinIcons[option.asset]} 
              alt={option.asset} 
              width={32} 
              height={32}
              className="object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400">{option.asset}</span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-white">{option.asset}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded ${
            option.type === 'CALL' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {option.type}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] text-gray-500 uppercase">Premium</div>
        <div className="text-sm font-bold text-yellow-400">{option.premium.toFixed(4)} USD</div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className="bg-gray-800/30 border border-gray-700/30 p-2 text-center rounded-lg">
        <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
          <Activity className="w-3 h-3" /> Strike
        </div>
        <div className="text-sm font-semibold text-white">${option.strike.toLocaleString()}</div>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 p-2 text-center rounded-lg">
        <div className="text-[10px] text-green-400 flex items-center justify-center gap-1">
          <TrendingUp className="w-3 h-3" /> Leverage
        </div>
        <div className="text-sm font-bold text-green-400">{option.apy}x</div>
      </div>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/20 p-2 text-center rounded-lg mb-3">
      <div className="text-[10px] text-blue-400 flex items-center justify-center gap-1">
        <Clock className="w-3 h-3" /> Expiry
      </div>
      <div className="text-sm font-semibold text-blue-300">{option.expiry}</div>
    </div>

    <Link href={`/trade?signature=${encodeURIComponent(option.raw.signature)}`} className="block">
      <button className="w-full text-sm font-semibold text-black py-3 rounded-xl transition-all" style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }}>
        Go to Trade
      </button>
    </Link>
  </div>
)

const AIAgent = () => {
  const { messages, isLoading, sendMessage } = useChat()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    const message = inputValue.trim()
    setInputValue('')
    await sendMessage(message)
  }

  const quickActions = [
    { label: "What's a Call?", message: "Explain what a call option is in simple terms" },
    { label: "What's a Put?", message: "Explain what a put option is in simple terms" },
    { label: "Best Strategy", message: "What's the best options strategy for beginners?" },
    { label: "Quick Trade", message: "Help me find a quick options trade" },
  ]

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-white flex items-center gap-2">
              Sentix AI Buddy
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h1>
            <p className="text-xs text-blue-300">Your options trading helper!</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => sendMessage(action.message)}
              disabled={isLoading}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-500/30 px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-gray-300 hover:text-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 backdrop-blur-sm border border-white/10 rounded-2xl custom-scrollbar" style={{ background: 'rgba(26,26,26,0.5)' }}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <h2 className="font-bold text-white text-lg mb-2">Welcome!</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              I&apos;m your AI buddy! Ask me anything about options trading. 
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
              <div className={`flex items-end gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  {message.role === 'user' ? '🧑' : '🤖'}
                </div>
                <div className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-white/10 border border-white/10 text-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.recommendedTrade && (
                    <MiniOptionCard option={message.recommendedTrade} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-lg">
                🤖
              </div>
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl">
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-blue-400">Thinking</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2 text-gray-500">
          Press Enter to send • Powered by AI Magic ✨
        </p>
      </form>
    </div>
  )
}

export default AIAgent