'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

import { config } from '@/lib/config/wallet';
import { WalletModalProvider } from '@/context/WalletModalContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { WalletModal } from '@/components/ui/WalletModal';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletModalProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
          <WalletModal />
        </WalletModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

