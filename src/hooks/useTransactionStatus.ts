import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { arbitrum } from 'wagmi/chains';

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  confirmations: number;
  error?: string;
}

export const useTransactionStatus = (hash?: string) => {
  const publicClient = usePublicClient({ chainId: arbitrum.id });
  const [status, setStatus] = useState<TransactionStatus | null>(null);

  useEffect(() => {
    if (!hash || !publicClient) return;

    const checkTransaction = async () => {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash: hash as `0x${string}` });
        
        if (receipt) {
          const block = await publicClient.getBlock();
          const confirmations = Number(block.number - receipt.blockNumber);
          
          setStatus({
            hash,
            status: receipt.status === 'success' ? 'success' : 'failed',
            confirmations,
          });
        } else {
          setStatus({
            hash,
            status: 'pending',
            confirmations: 0,
          });
        }
      } catch (error) {
        setStatus({
          hash,
          status: 'failed',
          confirmations: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    checkTransaction();
    const interval = setInterval(checkTransaction, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [hash, publicClient]);

  return status;
};