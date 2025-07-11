import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'success' | 'failed';
}

export const useTransactionHistory = (
  provider: BrowserProvider | null,
  address: string | null
) => {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!provider || !address) return;

    setLoading(true);
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);
      
      const filter = {
        fromBlock,
        toBlock: 'latest',
        to: address
      };

      const logs = await provider.getLogs(filter);
      
      const transactions = await Promise.all(
        logs.slice(0, 50).map(async (log) => {
          const tx = await provider.getTransaction(log.transactionHash);
          const receipt = await provider.getTransactionReceipt(log.transactionHash);
          const block = await provider.getBlock(log.blockNumber);
          
          if (!tx || !receipt || !block) return null;
          
          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || '',
            value: ethers.formatEther(tx.value),
            timestamp: block.timestamp,
            status: receipt.status === 1 ? 'success' : 'failed'
          } as Transaction;
        })
      );

      const validTransactions = transactions.filter(Boolean) as Transaction[];

      const cacheKey = `tx_history_${address}`;
      localStorage.setItem(cacheKey, JSON.stringify(validTransactions));
      
      setHistory(validTransactions);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      
      const cacheKey = `tx_history_${address}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setHistory(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [provider, address]);

  useEffect(() => {
    fetchHistory();
    
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return { history, loading, refetch: fetchHistory };
};