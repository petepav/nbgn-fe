interface NetworkParams {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const getNetworkParams = (chainId: number): NetworkParams => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        blockExplorerUrls: ['https://etherscan.io/'],
      };
    
    case 42161: // Arbitrum One
      return {
        chainId: '0xa4b1',
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io/'],
      };
    
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

export const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 42161:
      return 'Arbitrum One';
    default:
      return 'Unknown Network';
  }
};