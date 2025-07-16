/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-explicit-any */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ethers, Contract } from 'ethers';
import { SUPPORTED_TOKENS, DEFAULT_TOKEN, TokenConfig } from '../config/tokens';
import { NBGN_ABI } from '../contracts/abis/NBGN';
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
  getTokenBalance: (symbol?: string) => { balance: string; rawBalance: string; formattedBalance: string };
  formatTokenAmount: (amount: string | ethers.BigNumberish, symbol?: string) => string;
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
  const getTokenConfig = useCallback((symbol: string = selectedToken): TokenConfig => {
    return SUPPORTED_TOKENS[symbol];
  }, [selectedToken]);

  // Get token contract instance
  const getTokenContract = useCallback(async (symbol: string = selectedToken): Promise<Contract | null> => {
    if (!web3.provider) return null;

    const config = getTokenConfig(symbol);
    if (!config) return null;

    try {
      const signer = await web3.provider.getSigner();
      // For now, both NBGN and DBGN use the same ABI structure
      return new ethers.Contract(config.address, NBGN_ABI, signer);
    } catch (error) {
      console.error(`Failed to create ${symbol} contract:`, error);
      return null;
    }
  }, [web3.provider, getTokenConfig, selectedToken]);

  // Get token balance
  const getTokenBalance = useCallback((symbol: string = selectedToken) => {
    return tokenBalances[symbol] || {
      balance: '0',
      rawBalance: '0',
      formattedBalance: '0.00'
    };
  }, [selectedToken, tokenBalances]);

  // Format token amount
  const formatTokenAmount = useCallback((amount: string | ethers.BigNumberish, symbol: string = selectedToken): string => {
    const config = getTokenConfig(symbol);
    try {
      return ethers.formatUnits(amount, config.decimals);
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0';
    }
  }, [selectedToken, getTokenConfig]);

  // Parse token amount
  const parseTokenAmount = useCallback((amount: string, symbol: string = selectedToken): bigint => {
    const config = getTokenConfig(symbol);
    try {
      return ethers.parseUnits(amount, config.decimals);
    } catch (error) {
      console.error('Error parsing token amount:', error);
      return BigInt(0);
    }
  }, [selectedToken, getTokenConfig]);

  // Fetch all token balances
  const refreshBalances = useCallback(async () => {
    if (!user.address || !web3.provider) return;

    setLoading(true);
    const newBalances: TokenBalance = {};

    for (const [symbol, config] of Object.entries(SUPPORTED_TOKENS)) {
      try {
        const contract = await getTokenContract(symbol);
        if (!contract) continue;

        const balance = await contract.balanceOf(user.address);
        const rawBalance = formatTokenAmount(balance, symbol);
        
        // Format with proper locale
        const formattedBalance = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(parseFloat(rawBalance));

        newBalances[symbol] = {
          balance: balance.toString(),
          rawBalance,
          formattedBalance
        };
      } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
        newBalances[symbol] = {
          balance: '0',
          rawBalance: '0',
          formattedBalance: '0.00'
        };
      }
    }

    setTokenBalances(newBalances);
    setLoading(false);
  }, [user.address, web3.provider, getTokenContract, formatTokenAmount]);

  // Select token
  const selectToken = useCallback((symbol: string) => {
    if (SUPPORTED_TOKENS[symbol]) {
      setSelectedToken(symbol);
      localStorage.setItem('selectedToken', symbol);
    }
  }, []);

  // Load saved token preference
  useEffect(() => {
    const saved = localStorage.getItem('selectedToken');
    if (saved && SUPPORTED_TOKENS[saved]) {
      setSelectedToken(saved);
    }
  }, []);

  // Check if current network matches token requirement
  const isCorrectNetwork = useCallback((symbol: string = selectedToken): boolean => {
    const config = getTokenConfig(symbol);
    return currentChainId === config.chainId;
  }, [selectedToken, currentChainId, getTokenConfig]);

  // Switch to the required network for a token
  const switchToTokenNetwork = useCallback(async (symbol: string = selectedToken) => {
    if (!web3.provider) return;
    
    const config = getTokenConfig(symbol);
    const targetChainId = `0x${config.chainId.toString(16)}`;
    
    try {
      // @ts-ignore - ethereum provider types
      await web3.provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added
      if (switchError.code === 4902) {
        try {
          const networkParams = getNetworkParams(config.chainId);
          // @ts-ignore - ethereum provider types
          await web3.provider.provider.request({
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
  }, [web3.provider, selectedToken, getTokenConfig]);

  // Refresh balances when wallet connects or changes
  useEffect(() => {
    if (user.address && web3.connected) {
      void refreshBalances();
      
      // Set up polling for balance updates
      const interval = setInterval(refreshBalances, 15000); // Every 15 seconds
      return () => clearInterval(interval);
    }
  }, [user.address, web3.connected, refreshBalances]);

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
    switchToTokenNetwork
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};