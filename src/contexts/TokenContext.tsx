/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-explicit-any, no-unused-vars */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { ethers, Contract } from 'ethers';
import { SUPPORTED_TOKENS, DEFAULT_TOKEN, TokenConfig } from '../config/tokens';
import { NBGN_ABI } from '../contracts/abis/NBGN';
import { DBGN_ABI } from '../contracts/abis/DBGN';
import { useAppState } from './AppContext';
import { getNetworkParams } from '../utils/networks';

interface TokenBalance {
  [symbol: string]: {
    balance: string;
    rawBalance: string;
    formattedBalance: string;
  };
}

interface TokenContextType {
  selectedToken: string;
  selectToken: (symbol: string) => void;
  supportedTokens: typeof SUPPORTED_TOKENS;
  getTokenConfig: (symbol?: string) => TokenConfig;
  getTokenContract: (symbol?: string) => Promise<Contract | null>;
  getTokenBalance: (symbol?: string) => {
    balance: string;
    rawBalance: string;
    formattedBalance: string;
  };
  formatTokenAmount: (
    amount: string | ethers.BigNumberish,
    symbol?: string
  ) => string;
  parseTokenAmount: (amount: string, symbol?: string) => bigint;
  tokenBalances: TokenBalance;
  loading: boolean;
  refreshBalances: () => Promise<void>;
  isCorrectNetwork: (symbol?: string) => boolean;
  switchToTokenNetwork: (symbol?: string) => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokenContext must be used within TokenProvider');
  }
  return context;
};

interface TokenProviderProps {
  children: React.ReactNode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const { web3, user } = useAppState();
  const [selectedToken, setSelectedToken] = useState(DEFAULT_TOKEN);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance>({});
  const [loading, setLoading] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | undefined>();

  // Get current chain ID from provider
  useEffect(() => {
    const getChainId = async () => {
      if (web3.provider) {
        try {
          const network = await web3.provider.getNetwork();
          setCurrentChainId(Number(network.chainId));
        } catch (error) {
          console.error('Error getting chain ID:', error);
        }
      }
    };
    void getChainId();
  }, [web3.provider]);

  // Get token configuration
  const getTokenConfig = useCallback(
    (symbol: string = selectedToken): TokenConfig => {
      const token =
        symbol === 'NBGN'
          ? SUPPORTED_TOKENS.NBGN
          : symbol === 'DBGN'
            ? SUPPORTED_TOKENS.DBGN
            : symbol === 'GBGN'
              ? SUPPORTED_TOKENS.GBGN
              : SUPPORTED_TOKENS.NBGN;
      return token;
    },
    [selectedToken]
  );

  // Get token contract instance
  const getTokenContract = useCallback(
    async (symbol: string = selectedToken): Promise<Contract | null> => {
      if (!web3.provider) return null;

      const config = getTokenConfig(symbol);
      if (!config) return null;

      try {
        const signer = await web3.provider.getSigner();
        // Use appropriate ABI for each token
        const abi = symbol === 'DBGN' ? DBGN_ABI : NBGN_ABI;
        return new ethers.Contract(config.address, abi, signer);
      } catch (error) {
        console.error(`Failed to create ${symbol} contract:`, error);
        return null;
      }
    },
    [web3.provider, getTokenConfig, selectedToken]
  );

  // Get token balance
  const getTokenBalance = useCallback(
    (symbol: string = selectedToken) => {
      const balance =
        symbol === 'NBGN'
          ? tokenBalances.NBGN
          : symbol === 'DBGN'
            ? tokenBalances.DBGN
            : symbol === 'GBGN'
              ? tokenBalances.GBGN
              : null;
      return (
        balance || {
          balance: '0',
          rawBalance: '0',
          formattedBalance: '0.00',
        }
      );
    },
    [selectedToken, tokenBalances]
  );

  // Format token amount
  const formatTokenAmount = useCallback(
    (
      amount: string | ethers.BigNumberish,
      symbol: string = selectedToken
    ): string => {
      const config = getTokenConfig(symbol);
      try {
        return ethers.formatUnits(amount, config.decimals);
      } catch (error) {
        console.error('Error formatting token amount:', error);
        return '0';
      }
    },
    [selectedToken, getTokenConfig]
  );

  // Parse token amount
  const parseTokenAmount = useCallback(
    (amount: string, symbol: string = selectedToken): bigint => {
      const config = getTokenConfig(symbol);
      try {
        return ethers.parseUnits(amount, config.decimals);
      } catch (error) {
        console.error('Error parsing token amount:', error);
        return BigInt(0);
      }
    },
    [selectedToken, getTokenConfig]
  );

  // Fetch all token balances
  const refreshBalances = useCallback(async () => {
    if (!user.address || !web3.provider) return;

    console.log('🔄 Refreshing balances for address:', user.address);
    setLoading(true);
    const newBalances: TokenBalance = {};

    for (const [symbol, config] of Object.entries(SUPPORTED_TOKENS)) {
      try {
        // Only fetch balance if we're on the correct network for this token
        if (currentChainId === config.chainId) {
          const contract = await getTokenContract(symbol);
          if (!contract) continue;

          const balance = await contract.balanceOf(user.address);
          const rawBalance = formatTokenAmount(balance, symbol);

          // Format with proper locale
          const formattedBalance = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(parseFloat(rawBalance));

          if (symbol === 'NBGN') {
            newBalances.NBGN = {
              balance: balance.toString(),
              rawBalance,
              formattedBalance,
            };
          } else if (symbol === 'DBGN') {
            newBalances.DBGN = {
              balance: balance.toString(),
              rawBalance,
              formattedBalance,
            };
          } else if (symbol === 'GBGN') {
            newBalances.GBGN = {
              balance: balance.toString(),
              rawBalance,
              formattedBalance,
            };
          }
        } else {
          // Token is on different network, show zero balance
          if (symbol === 'NBGN') {
            newBalances.NBGN = {
              balance: '0',
              rawBalance: '0',
              formattedBalance: '0.00',
            };
          } else if (symbol === 'DBGN') {
            newBalances.DBGN = {
              balance: '0',
              rawBalance: '0',
              formattedBalance: '0.00',
            };
          } else if (symbol === 'GBGN') {
            newBalances.GBGN = {
              balance: '0',
              rawBalance: '0',
              formattedBalance: '0.00',
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
        if (symbol === 'NBGN') {
          newBalances.NBGN = {
            balance: '0',
            rawBalance: '0',
            formattedBalance: '0.00',
          };
        } else if (symbol === 'DBGN') {
          newBalances.DBGN = {
            balance: '0',
            rawBalance: '0',
            formattedBalance: '0.00',
          };
        } else if (symbol === 'GBGN') {
          newBalances.GBGN = {
            balance: '0',
            rawBalance: '0',
            formattedBalance: '0.00',
          };
        }
      }
    }

    setTokenBalances(newBalances);
    setLoading(false);
    console.log('✅ Balance refresh complete:', newBalances);
  }, [
    user.address,
    web3.provider,
    getTokenContract,
    formatTokenAmount,
    currentChainId,
  ]);

  // Select token
  const selectToken = useCallback((symbol: string) => {
    const isValidToken =
      symbol === 'NBGN' || symbol === 'DBGN' || symbol === 'GBGN';
    if (isValidToken) {
      setSelectedToken(symbol);
      localStorage.setItem('selectedToken', symbol);
    }
  }, []);

  // Load saved token preference
  useEffect(() => {
    const saved = localStorage.getItem('selectedToken');
    const isValidToken =
      saved === 'NBGN' || saved === 'DBGN' || saved === 'GBGN';
    if (saved && isValidToken) {
      setSelectedToken(saved);
    }
  }, []);

  // Check if current network matches token requirement
  const isCorrectNetwork = useCallback(
    (symbol: string = selectedToken): boolean => {
      const config = getTokenConfig(symbol);
      return currentChainId === config.chainId;
    },
    [selectedToken, currentChainId, getTokenConfig]
  );

  // Switch to the required network for a token
  const switchToTokenNetwork = useCallback(
    async (symbol: string = selectedToken) => {
      if (!web3.provider) return;

      const config = getTokenConfig(symbol);
      const targetChainId = `0x${config.chainId.toString(16)}`;

      try {
        // @ts-ignore - ethereum provider types
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added
        if (switchError.code === 4902) {
          try {
            const networkParams = getNetworkParams(config.chainId);
            // @ts-ignore - ethereum provider types
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkParams],
            });
          } catch (addError) {
            console.error('Failed to add network:', addError);
            throw addError;
          }
        } else {
          console.error('Failed to switch network:', switchError);
          throw switchError;
        }
      }
    },
    [web3.provider, selectedToken, getTokenConfig]
  );

  // Refresh balances when wallet connects or address changes
  useEffect(() => {
    let interval: number | undefined;
    let timeoutId: number | undefined;

    console.log('🔄 TokenContext: Address/Connection change detected', {
      address: user.address,
      connected: web3.connected,
      chainId: currentChainId,
    });

    if (user.address && web3.connected) {
      // Immediately refresh balances when address changes
      console.log(
        '🔄 TokenContext: Refreshing balances for new address:',
        user.address
      );

      // Add a small delay to ensure provider is ready with new account
      timeoutId = window.setTimeout(() => {
        void refreshBalances();
      }, 100);

      // Set up polling for balance updates
      interval = window.setInterval(() => {
        void refreshBalances();
      }, 15000); // Every 15 seconds
    } else {
      // Clear balances when disconnected
      console.log('🔄 TokenContext: Clearing balances - disconnected');
      setTokenBalances({});
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [user.address, web3.connected, currentChainId, refreshBalances]);

  const value: TokenContextType = {
    selectedToken,
    selectToken,
    supportedTokens: SUPPORTED_TOKENS,
    getTokenConfig,
    getTokenContract,
    getTokenBalance,
    formatTokenAmount,
    parseTokenAmount,
    tokenBalances,
    loading,
    refreshBalances,
    isCorrectNetwork,
    switchToTokenNetwork,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
};
