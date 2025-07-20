import { createConfig, http } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import { walletConnect, metaMask, injected } from 'wagmi/connectors';

const projectId = process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [arbitrum],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [arbitrum.id]: http(),
  },
});

export const NBGN_CONTRACT_ADDRESS = '0x66Eb0Aa46827e5F3fFcb6Dea23C309CB401690B6';
export const NBGN_TOKEN_ADDRESS = '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067';