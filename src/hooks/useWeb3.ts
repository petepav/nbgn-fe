import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { useAppDispatch } from '../contexts/AppContext';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      // eslint-disable-next-line no-undef
      infuraId: process.env.REACT_APP_INFURA_ID
    }
  }
};

const web3Modal = new Web3Modal({
  // eslint-disable-next-line no-undef
  network: process.env.REACT_APP_NETWORK || 'arbitrum',
  cacheProvider: true,
  providerOptions
});

export const useWeb3 = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawProvider, setRawProvider] = useState<any>(null);
  const dispatch = useAppDispatch();

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // Clear local state when accounts are disconnected
      web3Modal.clearCachedProvider();
      setProvider(null);
      setAccount(null);
      setRawProvider(null);
      dispatch({ type: 'DISCONNECT' });
    } else {
      setAccount(accounts[0]);
    }
  }, [dispatch]);

  const handleChainChanged = useCallback(() => {
    // eslint-disable-next-line no-undef
    window.location.reload();
  }, []);

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
      // eslint-disable-next-line no-console, no-undef
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, handleAccountsChanged, handleChainChanged]);

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
      // eslint-disable-next-line no-console, no-undef
      console.warn('Error during disconnect:', error);
      
      // Still proceed with state cleanup even if provider disconnect fails
      web3Modal.clearCachedProvider();
      setProvider(null);
      setAccount(null);
      setRawProvider(null);
      dispatch({ type: 'DISCONNECT' });
    }
  }, [dispatch, rawProvider]);

  // Auto-connect on app load if provider was cached
  useEffect(() => {
    const autoConnect = async () => {
      if (web3Modal.cachedProvider && !provider) {
        await connectWallet();
      }
    };
    
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void autoConnect();
  }, [connectWallet, provider]);

  return { provider, account, loading, connectWallet, disconnectWallet };
};