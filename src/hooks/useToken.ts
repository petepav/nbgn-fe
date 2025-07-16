import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { useTokenContext } from '../contexts/TokenContext';

interface TokenOperations {
  balance: string;
  rawBalance: string;
  formattedBalance: string;
  loading: boolean;
  error: string | null;
  transfer: (to: string, amount: string) => Promise<ethers.ContractTransactionResponse>;
  approve: (spender: string, amount: string) => Promise<ethers.ContractTransactionResponse>;
  getAllowance: (owner: string, spender: string) => Promise<string>;
  refresh: () => Promise<void>;
  getContract: () => Promise<ethers.Contract | null>;
}

export const useToken = (tokenSymbol?: string): TokenOperations => {
  const { web3, user } = useAppState();
  const dispatch = useAppDispatch();
  const { 
    selectedToken, 
    getTokenContract, 
    getTokenBalance,
    parseTokenAmount,
    formatTokenAmount,
    refreshBalances 
  } = useTokenContext();

  const symbol = tokenSymbol || selectedToken;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenBalance = getTokenBalance(symbol);

  const transfer = useCallback(async (to: string, amount: string) => {
    if (!web3.provider || !user.address) {
      throw new Error('Wallet not connected');
    }

    const contract = await getTokenContract(symbol);
    if (!contract) {
      throw new Error(`${symbol} contract not available`);
    }

    const amountWei = parseTokenAmount(amount, symbol);
    
    // Check balance
    const currentBalance = await contract.balanceOf(user.address);
    if (currentBalance < amountWei) {
      throw new Error(`Insufficient ${symbol} balance`);
    }

    // Execute transfer
    const transaction = await contract.transfer(to, amountWei);
    
    // Refresh balance after transaction
    await transaction.wait();
    await refreshBalances();
    
    return transaction;
  }, [web3.provider, user.address, symbol, getTokenContract, parseTokenAmount, refreshBalances]);

  const approve = useCallback(async (spender: string, amount: string) => {
    if (!web3.provider || !user.address) {
      throw new Error('Wallet not connected');
    }

    const contract = await getTokenContract(symbol);
    if (!contract) {
      throw new Error(`${symbol} contract not available`);
    }

    const amountWei = parseTokenAmount(amount, symbol);
    const transaction = await contract.approve(spender, amountWei);
    
    return transaction;
  }, [web3.provider, user.address, symbol, getTokenContract, parseTokenAmount]);

  const getAllowance = useCallback(async (owner: string, spender: string) => {
    const contract = await getTokenContract(symbol);
    if (!contract) {
      return '0';
    }

    const allowance = await contract.allowance(owner, spender);
    return formatTokenAmount(allowance, symbol);
  }, [symbol, getTokenContract, formatTokenAmount]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshBalances();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  }, [refreshBalances]);

  // Update global state when balance changes (for NBGN compatibility)
  useEffect(() => {
    if (symbol === 'NBGN' && user.address) {
      dispatch({
        type: 'SET_USER',
        payload: {
          address: user.address,
          balance: tokenBalance.formattedBalance
        }
      });
    }
  }, [symbol, user.address, tokenBalance.formattedBalance, dispatch]);

  return {
    balance: tokenBalance.balance,
    rawBalance: tokenBalance.rawBalance,
    formattedBalance: tokenBalance.formattedBalance,
    loading,
    error,
    transfer,
    approve,
    getAllowance,
    refresh,
    getContract: () => getTokenContract(symbol)
  };
};