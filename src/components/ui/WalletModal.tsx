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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-4 border-purple-800 p-6 max-w-sm w-full shadow-[8px_8px_0_0_rgba(107,33,168,1)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="pixel-font text-lg text-purple-900">SELECT WALLET</h2>
          <button onClick={closeWalletModal} className="text-purple-900 hover:text-purple-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnectorSelect(connector)}
              className="pixel-font text-sm bg-purple-100 hover:bg-purple-200 text-purple-900 py-3 px-4 border-2 border-purple-300 flex items-center justify-between transition-colors"
            >
              <span>{connector.name}</span>
              <Wallet className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
