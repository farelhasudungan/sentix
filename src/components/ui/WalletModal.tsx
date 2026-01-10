'use client';

import React from 'react';
import { X, Wallet } from 'lucide-react';
import { useConnectors, useConnect } from 'wagmi';
import { useWalletModal } from '@/context/WalletModalContext';

export function WalletModal() {
  const { isWalletModalOpen, closeWalletModal } = useWalletModal();
  const connectors = useConnectors();
  const { connect } = useConnect();

  const handleConnectorSelect = (connector: ReturnType<typeof useConnectors>[number]) => {
    connect({ connector });
    closeWalletModal();
  };

  if (!isWalletModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full" style={{ background: 'rgba(20,20,20,0.95)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)', boxShadow: '0 4px 14px rgba(251,191,36,0.3)' }}>
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <h2 className="font-bold text-white text-lg">Connect Wallet</h2>
          </div>
          <button 
            onClick={closeWalletModal} 
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-6">Choose your preferred wallet to connect to Sentix</p>
        <div className="flex flex-col gap-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnectorSelect(connector)}
              className="border border-white/10 text-white py-4 px-5 rounded-xl flex items-center justify-between transition-all group"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <span className="font-medium">{connector.name}</span>
              <Wallet className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
            </button>
          ))}
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
