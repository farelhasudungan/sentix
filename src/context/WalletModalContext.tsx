'use client';

import React, { createContext, useContext, useState } from 'react';

interface WalletModalContextType {
  openWalletModal: () => void;
  closeWalletModal: () => void;
  isWalletModalOpen: boolean;
}

const WalletModalContext = createContext<WalletModalContextType | undefined>(undefined);

export function WalletModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWalletModal = () => setIsOpen(true);
  const closeWalletModal = () => setIsOpen(false);

  return (
    <WalletModalContext.Provider value={{ openWalletModal, closeWalletModal, isWalletModalOpen: isOpen }}>
      {children}
    </WalletModalContext.Provider>
  );
}

export function useWalletModal() {
  const context = useContext(WalletModalContext);
  if (context === undefined) {
    throw new Error('useWalletModal must be used within a WalletModalProvider');
  }
  return context;
}
