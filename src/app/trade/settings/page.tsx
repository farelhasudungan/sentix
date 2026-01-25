'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Settings, User, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { useUserAlias, saveAlias, checkAliasAvailability } from '@/hooks/useUserAlias'
import { useWalletModal } from '@/context/WalletModalContext'

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const { openWalletModal } = useWalletModal()
  const { alias, refetch } = useUserAlias(address)


  const [inputAlias, setInputAlias] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Initialize input with current alias
  useEffect(() => {
    if (alias) {
      setInputAlias(alias)
      setIsAvailable(true)
    }
  }, [alias])

  // Check availability when input changes
  useEffect(() => {
    if (!inputAlias || inputAlias.length < 3) {
      setIsAvailable(null)
      setAvailabilityMessage(inputAlias ? 'Minimum 3 characters' : '')
      return
    }

    // Validate format
    const ALIAS_REGEX = /^[a-zA-Z0-9_]{3,20}$/
    if (!ALIAS_REGEX.test(inputAlias)) {
      setIsAvailable(false)
      setAvailabilityMessage('Only letters, numbers, and underscores allowed')
      return
    }

    // If same as current alias, it's available
    if (alias && inputAlias.toLowerCase() === alias.toLowerCase()) {
      setIsAvailable(true)
      setAvailabilityMessage('Your current alias')
      return
    }

    const debounceTimer = setTimeout(async () => {
      setIsChecking(true)
      const result = await checkAliasAvailability(inputAlias, address)
      setIsAvailable(result.available)
      setAvailabilityMessage(result.available ? 'Available!' : (result.reason || 'Not available'))
      setIsChecking(false)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [inputAlias, alias, address])

  const handleSave = async () => {
    if (!address || !inputAlias || !isAvailable) return

    setIsSaving(true)
    setSaveMessage(null)

    const result = await saveAlias(address, inputAlias)

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Alias saved successfully!' })
      refetch()
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save alias' })
    }

    setIsSaving(false)

    // Auto-hide success message
    if (result.success) {
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="w-full max-w-md rounded-2xl p-8 border border-white/10 text-center"
          style={{ background: 'rgba(26,26,26,0.8)' }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <Settings className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 text-sm mb-6">
            Connect your wallet to access settings
          </p>
          <button
            onClick={openWalletModal}
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ 
              background: 'linear-gradient(to bottom, #ffd48d, #b78751)', 
              color: '#FFFDE5', 
              textShadow: '0 -1px 0 rgb(178 140 2 / 100%)',
              boxShadow: '0 4px 14px rgba(251,191,36,0.3)'
            }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <Settings className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Profile Section */}
        <section 
          className="rounded-2xl p-6 border border-white/10 mb-6"
          style={{ background: 'rgba(26,26,26,0.8)' }}
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            Profile
          </h2>

          {/* Current Wallet */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Wallet Address
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, #22c55e, #10b981)',
                  color: '#fff'
                }}
              >
                {address?.slice(2, 4).toUpperCase()}
              </div>
              <code className="text-sm text-gray-300 font-mono break-all flex-1">
                {address}
              </code>
            </div>
          </div>

          {/* Alias Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Display Name (Alias)
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputAlias}
                onChange={(e) => setInputAlias(e.target.value.slice(0, 20))}
                placeholder="Enter your alias (e.g., trader123)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : isAvailable === true ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : isAvailable === false ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : null}
              </div>
            </div>
            {availabilityMessage && (
              <p className={`mt-2 text-sm ${
                isAvailable === true ? 'text-green-400' : 
                isAvailable === false ? 'text-red-400' : 
                'text-gray-500'
              }`}>
                {availabilityMessage}
              </p>
            )}
            <p className="text-gray-600 text-xs mt-2">
              3-20 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!isAvailable || isSaving || inputAlias === alias}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: isAvailable && inputAlias !== alias
                ? 'linear-gradient(to bottom, #ffd48d, #b78751)'
                : 'rgba(255,255,255,0.1)',
              color: isAvailable && inputAlias !== alias ? '#FFFDE5' : '#9ca3af',
              textShadow: isAvailable && inputAlias !== alias ? '0 -1px 0 rgb(178 140 2 / 100%)' : 'none',
            }}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : inputAlias === alias ? (
              'No changes'
            ) : (
              'Save Alias'
            )}
          </button>

          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
              saveMessage.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {saveMessage.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{saveMessage.text}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
