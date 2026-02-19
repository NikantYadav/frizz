'use client';

import { useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Wagmi/WalletConnect warn "already initialized" because Next.js SSR runs this
// module on both server and client. The fix is to create config lazily inside
// the component wrapped in useState so it only runs on the client.
export function Providers({ children }: { children: React.ReactNode }) {
  const [config] = useState(() =>
    getDefaultConfig({
      appName: 'Frizz Marketplace',
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE',
      chains: [mainnet, sepolia, hardhat],
      ssr: false, // Disable SSR – we are a client-only dApp connecting to a local node
    })
  );

  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
