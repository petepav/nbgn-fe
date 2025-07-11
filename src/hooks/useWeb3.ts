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
  network: process.env.REACT_APP_NETWORK || 'mainnet',
  cacheProvider: true,
  providerOptions
});

export const useWeb3 = () => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    web3Modal.clearCachedProvider();
    setProvider(null);
    setAccount(null);
    dispatch({ type: 'DISCONNECT' });
  }, [dispatch]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  return { provider, account, loading, connectWallet, disconnectWallet };
};