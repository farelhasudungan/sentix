import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://base-rpc.thetanuts.finance'),
  },
  connectors: [
    walletConnect({ projectId: 'b8dc7992f6545c21809d82cd3772e82d' }),
    injected(),
  ],
});
