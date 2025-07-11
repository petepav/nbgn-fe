import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../contexts/AppContext';

interface TransactionState {
  status: 'idle' | 'pending' | 'submitted' | 'confirmed' | 'failed';
  hash: string | null;
  error: string | null;
}

export const useTransaction = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    hash: null,
    error: null,
  });

  const executeTransaction = useCallback(async (
    transactionFn: () => Promise<ethers.TransactionResponse>
  ) => {
    setState({ status: 'pending', hash: null, error: null });

    try {
      const tx = await transactionFn();
      setState({ status: 'submitted', hash: tx.hash, error: null });
      
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          hash: tx.hash,
          status: 'pending',
          timestamp: Date.now(),
        }
      });

      const receipt = await tx.wait();
      
      setState({ status: 'confirmed', hash: tx.hash, error: null });
      
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          hash: tx.hash,
          status: 'confirmed',
          timestamp: Date.now(),
          blockNumber: receipt?.blockNumber,
        }
      });

      return receipt;
    } catch (error: any) {
      const errorMessage = error.reason || error.message || t('transaction.failed');
      setState({ status: 'failed', hash: null, error: errorMessage });
      throw error;
    }
  }, [dispatch, t]);

  return { ...state, executeTransaction };
};