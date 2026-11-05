'use client';

import React from 'react';
import { Layers, Zap, BarChart3, GitBranch, Target, Clock } from 'lucide-react';
import { FilterBar } from '@/components/ui/FilterBar';

export type StructureFilterType = 'ALL' | 'Vanilla' | 'Spread' | 'Butterfly' | 'Condor'

export const STRUCTURE_FILTERS: { value: StructureFilterType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'ALL', label: 'All', icon: <Layers className="w-3.5 h-3.5" />, description: 'Show all structures' },
  { value: 'Vanilla', label: 'Basic', icon: <Zap className="w-3.5 h-3.5" />, description: 'Simple call/put' },
  { value: 'Spread', label: 'Spread', icon: <BarChart3 className="w-3.5 h-3.5" />, description: '2-strike strategy' },
  { value: 'Butterfly', label: 'Butterfly', icon: <GitBranch className="w-3.5 h-3.5" />, description: '3-strike strategy' },
  { value: 'Condor', label: 'Condor', icon: <Target className="w-3.5 h-3.5" />, description: '4-strike range' },
]

export interface ExpiryFilterOption {
  value: string
  label: string
}

interface TradeFiltersProps {
  coins: string[]
  asset: string
  onAssetChange: (v: string) => void
  typeFilter: 'ALL' | 'CALL' | 'PUT'
  onTypeChange: (v: 'ALL' | 'CALL' | 'PUT') => void
  structureFilter: StructureFilterType
  onStructureChange: (v: StructureFilterType) => void
  structureCounts: Record<StructureFilterType, number>
  showExpiry: boolean
  expiryOptions: ExpiryFilterOption[]
  expiryFilter: string
  onExpiryChange: (v: string) => void
  expiryCounts: Record<string, number>
}

function Section({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-3 ${className}`} style={{ background: 'rgba(26,26,26,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
      {title && (
        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{title}</div>
      )}
      {children}
    </div>
  )
}

export function TradeFilters(props: TradeFiltersProps) {
  const {
    coins, asset, onAssetChange,
    typeFilter, onTypeChange,
    structureFilter, onStructureChange, structureCounts,
    showExpiry, expiryOptions, expiryFilter, onExpiryChange, expiryCounts,
  } = props

  const typeButtons = (['ALL', 'CALL', 'PUT'] as const).map((type) => ({
    type,
    className: typeFilter === type
      ? type === 'CALL'
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : type === 'PUT'
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10',
  }))

  return (
    <>
      {/* ---- Mobile: compact horizontal row ---- */}
      <div className="lg:hidden space-y-3 mb-4">
        <FilterBar options={coins} selected={asset} onSelect={onAssetChange} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {typeButtons.map(({ type, className }) => (
              <button key={type} onClick={() => onTypeChange(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${className}`}>
                {type}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex gap-1.5 overflow-x-auto">
            {STRUCTURE_FILTERS.map(({ value, label, icon }) => {
              const count = structureCounts[value]
              const isActive = structureFilter === value
              return (
                <button
                  key={value}
                  onClick={() => onStructureChange(value)}
                  title={STRUCTURE_FILTERS.find(f => f.value === value)?.description}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                      : count === 0
                        ? 'bg-white/3 text-gray-600 border border-white/5 cursor-not-allowed'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300'
                  }`}
                  disabled={count === 0 && !isActive}
                >
                  {icon}
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`ml-0.5 text-[10px] px-1 py-px rounded-full ${isActive ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Expiry: only shown in advanced mode (keeps basic mode uncluttered) */}
        {showExpiry && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            {expiryOptions.map(({ value, label }) => {
              const count = expiryCounts[value] ?? 0
              const isActive = expiryFilter === value
              return (
                <button
                  key={value}
                  onClick={() => onExpiryChange(value)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : count === 0
                        ? 'bg-white/3 text-gray-600 border border-white/5 cursor-not-allowed'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300'
                  }`}
                  disabled={count === 0 && !isActive}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-0.5 text-[10px] px-1 py-px rounded-full ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ---- Desktop: compact panel beside the content (horizontal groups) ---- */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-4 space-y-3">
          <Section title="Asset">
            <div className="grid grid-cols-3 gap-1.5">
              {coins.map((coin) => {
                const isActive = asset === coin
                return (
                  <button
                    key={coin}
                    onClick={() => onAssetChange(coin)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                    style={isActive
                      ? { background: 'linear-gradient(to right, #fbbf24, #d97706)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {coin}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Type">
            <div className="grid grid-cols-3 gap-1.5">
              {typeButtons.map(({ type, className }) => (
                <button key={type} onClick={() => onTypeChange(type)} className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${className}`}>
                  {type}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Structure">
            <div className="flex flex-wrap gap-1.5">
              {STRUCTURE_FILTERS.map(({ value, label, icon }) => {
                const count = structureCounts[value]
                const isActive = structureFilter === value
                return (
                  <button
                    key={value}
                    onClick={() => onStructureChange(value)}
                    title={STRUCTURE_FILTERS.find(f => f.value === value)?.description}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : count === 0
                          ? 'bg-white/3 text-gray-600 border border-white/5 cursor-not-allowed'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300'
                    }`}
                    disabled={count === 0 && !isActive}
                  >
                    {icon}
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1 py-px rounded-full ${isActive ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-gray-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Expiry">
            <div className="flex flex-wrap gap-1.5">
              {expiryOptions.map(({ value, label }) => {
                const count = expiryCounts[value] ?? 0
                const isActive = expiryFilter === value
                return (
                  <button
                    key={value}
                    onClick={() => onExpiryChange(value)}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : count === 0
                          ? 'bg-white/3 text-gray-600 border border-white/5 cursor-not-allowed'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300'
                    }`}
                    disabled={count === 0 && !isActive}
                  >
                    {value === 'ALL' && <Clock className="w-3.5 h-3.5" />}
                    <span>{label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1 py-px rounded-full ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-gray-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>
        </div>
      </aside>
    </>
  )
}