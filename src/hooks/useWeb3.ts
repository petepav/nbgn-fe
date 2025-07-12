import { useState, useCallback, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { useAppDispatch } from '../contexts/AppContext';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.REACT_APP_INFURA_ID
    }
  }
};

const web3Modal = new Web3Modal({
  network: process.env.REACT_APP_NETWORK || 'arbitrum',
  cacheProvider: true,
  providerOptions
});

export const useWeb3 = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rawProvider, setRawProvider] = useState<any>(null);
  const dispatch = useAppDispatch();

  const connectWallet = useCallback(async () => {
    setLoading(true);
    try {
      const connection = await web3Modal.connect();
      const provider = new BrowserProvider(connection);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAccount(address);
      setRawProvider(connection); // Store raw provider for disconnect
      
      // Initial dispatch with address only - NBGN balance will be fetched by useNBGN hook
      dispatch({
        type: 'SET_USER',
        payload: { 
          address, 
          balance: '0' // Will be updated by useNBGN hook
        }
      });
      
      dispatch({
        type: 'SET_WEB3',
        payload: { connected: true, provider }
      });

      connection.on("accountsChanged", handleAccountsChanged);
      connection.on("chainChanged", handleChainChanged);
      
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const disconnectWallet = useCallback(async () => {
    try {
      // Properly close the raw provider connection if it exists
      if (rawProvider) {
        // For WalletConnect providers
        if (rawProvider.disconnect) {
          await rawProvider.disconnect();
        }
        
        // For providers that have close method
        if (rawProvider.close) {
          await rawProvider.close();
        }
        
        // Remove event listeners
        if (rawProvider.removeAllListeners) {
          rawProvider.removeAllListeners();
        }
        
        // For MetaMask and other providers, remove event listeners manually
        try {
          if (rawProvider.removeListener) {
            rawProvider.removeListener("accountsChanged", handleAccountsChanged);
            rawProvider.removeListener("chainChanged", handleChainChanged);
          }
        } catch {
          // Silent fail for providers that don't support removeListener
        }
      }
      
      // Clear Web3Modal cache
      web3Modal.clearCachedProvider();
      
      // Reset local state
      setProvider(null);
      setAccount(null);
      setRawProvider(null);
      
      // Reset global state
      dispatch({ type: 'DISCONNECT' });
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error during disconnect:', error);
      
      // Still proceed with state cleanup even if provider disconnect fails
      web3Modal.clearCachedProvider();
      setProvider(null);
      setAccount(null);
      setRawProvider(null);
      dispatch({ type: 'DISCONNECT' });
    }
  }, [dispatch, rawProvider, handleAccountsChanged, handleChainChanged]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // Don't call disconnectWallet here to avoid circular dependency
      // Just clear the local state, the disconnect logic will handle the rest
      setProvider(null);
      setAccount(null);
      setRawProvider(null);
      dispatch({ type: 'DISCONNECT' });
    } else {
      setAccount(accounts[0]);
    }
  }, [dispatch]);

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  // Auto-connect on app load if provider was cached
  useEffect(() => {
    const autoConnect = async () => {
      if (web3Modal.cachedProvider && !provider) {
        await connectWallet();
      }
    };
    
    autoConnect();
  }, [connectWallet, provider]);

  return { provider, account, loading, connectWallet, disconnectWallet };
};