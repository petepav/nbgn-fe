import { useState, useCallback, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import { useTranslation } from 'react-i18next';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { NBGN_ABI } from '../contracts/abis/NBGN';
import environment from '../config/environment';
import { formatNBGN } from '../utils/formatters';

interface NBGNBalance {
  balance: string;
  rawBalance: string;
  formattedBalance: string;
  loading: boolean;
  error: string | null;
}

export const useNBGN = () => {
  const { web3, user } = useAppState();
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const [nbgnBalance, setNbgnBalance] = useState<NBGNBalance>({
    balance: '0',
    rawBalance: '0',
    formattedBalance: '0.00',
    loading: false,
    error: null
  });

  const getNBGNContract = useCallback(async (): Promise<Contract | null> => {
    if (!web3.provider || !environment.contractAddress) {
      console.log('Missing provider or contract address:', {
        hasProvider: !!web3.provider,
        contractAddress: environment.contractAddress
      });
      return null;
    }
    
    try {
      // Validate and checksum the contract address
      const checksummedAddress = ethers.getAddress(environment.contractAddress);
      console.log('Using checksummed contract address:', checksummedAddress);
      
      // Ensure we have a proper signer
      const signer = await web3.provider.getSigner();
      console.log('Creating NBGN contract with address:', checksummedAddress);
      return new ethers.Contract(checksummedAddress, NBGN_ABI, signer);
    } catch (error) {
      console.error('Failed to create NBGN contract:', error);
      return null;
    }
  }, [web3.provider]);

  const fetchNBGNBalance = useCallback(async (address?: string) => {
    const userAddress = address || user.address;
    if (!userAddress || !web3.provider) {
      return;
    }

    setNbgnBalance(prev => ({ ...prev, loading: true, error: null }));

    try {
      const contract = await getNBGNContract();
      if (!contract) {
        throw new Error('NBGN contract not available');
      }

      console.log('Fetching NBGN balance for address:', userAddress);
      const balance = await contract.balanceOf(userAddress);
      console.log('Raw balance from contract:', balance.toString());
      const balanceInEther = ethers.formatEther(balance);
      const formattedBalance = formatNBGN(balanceInEther, i18n.language);
      console.log('Formatted balance:', formattedBalance);

      setNbgnBalance({
        balance: balance.toString(),
        rawBalance: balanceInEther,
        formattedBalance,
        loading: false,
        error: null
      });

      // Update global state
      dispatch({
        type: 'SET_USER',
        payload: {
          address: userAddress,
          balance: formattedBalance
        }
      });

    } catch (error: any) {
      console.error('Failed to fetch NBGN balance:', error);
      setNbgnBalance(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch balance'
      }));
    }
  }, [user.address, web3.provider, getNBGNContract, dispatch]);

  const transferNBGN = useCallback(async (to: string, amount: string) => {
    if (!web3.provider || !user.address) {
      throw new Error('Wallet not connected');
    }

    const contract = await getNBGNContract();
    if (!contract) {
      throw new Error('NBGN contract not available');
    }

    const amountWei = ethers.parseEther(amount);
    
    // Check balance
    const currentBalance = await contract.balanceOf(user.address);
    if (currentBalance < amountWei) {
      throw new Error('Insufficient NBGN balance');
    }

    // Execute transfer
    const transaction = await contract.transfer(to, amountWei);
    
    // Refresh balance after transaction
    await transaction.wait();
    await fetchNBGNBalance();
    
    return transaction;
  }, [web3.provider, user.address, getNBGNContract, fetchNBGNBalance]);

  const approveNBGN = useCallback(async (spender: string, amount: string) => {
    if (!web3.provider || !user.address) {
      throw new Error('Wallet not connected');
    }

    const contract = await getNBGNContract();
    if (!contract) {
      throw new Error('NBGN contract not available');
    }

    const amountWei = ethers.parseEther(amount);
    const transaction = await contract.approve(spender, amountWei);
    
    return transaction;
  }, [web3.provider, user.address, getNBGNContract]);

  const getAllowance = useCallback(async (owner: string, spender: string) => {
    const contract = await getNBGNContract();
    if (!contract) {
      return '0';
    }

    const allowance = await contract.allowance(owner, spender);
    return ethers.formatEther(allowance);
  }, [getNBGNContract]);

  // Auto-fetch balance when user connects (with delay to ensure wallet is ready)
  useEffect(() => {
    if (user.address && web3.connected && web3.provider) {
      const timer = setTimeout(() => {
        fetchNBGNBalance();
      }, 1000); // Small delay to ensure wallet is fully connected
      
      return () => clearTimeout(timer);
    }
  }, [user.address, web3.connected, web3.provider, fetchNBGNBalance]);

  return {
    ...nbgnBalance,
    contract: null, // Remove direct contract access since it's async now
    getContract: getNBGNContract,
    fetchBalance: fetchNBGNBalance,
    transfer: transferNBGN,
    approve: approveNBGN,
    getAllowance,
    refresh: () => fetchNBGNBalance()
  };
};