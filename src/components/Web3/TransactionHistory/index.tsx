import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNBGN } from '../../../hooks/useNBGN';
import { useAppState } from '../../../contexts/AppContext';
import { ethers } from 'ethers';
import { useNBGNFormatter } from '../../../utils/formatters';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  type: 'sent' | 'received' | 'minted' | 'sold';
}

export const TransactionHistory: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { web3 } = useAppState();
  const { getContract } = useNBGN();
  const formatNBGN = useNBGNFormatter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user.address || !web3.provider) return;

      let contract;
      try {
        setLoading(true);
        contract = await getContract();
        if (!contract) return;

        // Get the current block number
        const currentBlock = await web3.provider.getBlockNumber();

        // Query Transfer events where user is sender or receiver
        // Look back 50000 blocks (approximately 7-10 days on Arbitrum)
        const fromBlock = Math.max(0, currentBlock - 50000);

        // Create filters for sent and received transactions
        const sentFilter = contract.filters.Transfer(user.address, null);
        const receivedFilter = contract.filters.Transfer(null, user.address);

        // Fetch events
        const [sentEvents, receivedEvents] = await Promise.all([
          contract.queryFilter(sentFilter, fromBlock, currentBlock),
          contract.queryFilter(receivedFilter, fromBlock, currentBlock),
        ]);

        // Process events into transactions
        const processedTxs: Transaction[] = [];
        const seenHashes = new Set<string>();

        // Combine all events and remove duplicates
        const allEvents = [...sentEvents, ...receivedEvents];

        for (const event of allEvents) {
          if (
            'args' in event &&
            !seenHashes.has(event.transactionHash) &&
            Array.isArray(event.args)
          ) {
            seenHashes.add(event.transactionHash);
            const block = await web3.provider.getBlock(event.blockNumber);
            const args = event.args as string[];
            processedTxs.push({
              hash: event.transactionHash,
              from: args[0],
              to: args[1],
              value: args[2].toString(),
              blockNumber: event.blockNumber,
              timestamp: block?.timestamp || 0,
              type: getTransactionType(args[0], args[1], user.address) as
                | 'sent'
                | 'received'
                | 'minted',
            });
          }
        }

        // Sort by block number (most recent first)
        processedTxs.sort((a, b) => b.blockNumber - a.blockNumber);

        // Limit to most recent 50 transactions
        setTransactions(processedTxs.slice(0, 50));
      } catch {
        // Silent error handling for now
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactions();
  }, [getContract, user.address, web3.provider]);

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const getTransactionType = (
    from: string,
    to: string,
    userAddress: string
  ) => {
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    if (
      from.toLowerCase() === zeroAddress.toLowerCase() &&
      to.toLowerCase() === userAddress.toLowerCase()
    ) {
      return 'minted';
    } else if (
      from.toLowerCase() === userAddress.toLowerCase() &&
      to.toLowerCase() === zeroAddress.toLowerCase()
    ) {
      return 'sold';
    } else if (from.toLowerCase() === userAddress.toLowerCase()) {
      return 'sent';
    } else {
      return 'received';
    }
  };

  const formatValue = (value: string) => {
    const etherValue = ethers.formatUnits(value, 18);
    return formatNBGN(etherValue);
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          <i className="fas fa-clock-rotate-left mr-2 text-green-600"></i>
          {t('web3:transaction.history', 'Transaction History')}
        </h3>
        <div className="loader-container">
          <div className="red-loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        <i className="fas fa-clock-rotate-left mr-2 text-green-600"></i>
        {t('web3:transaction.history', 'Transaction History')}
      </h3>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {t('web3:transaction.noHistory', 'No transactions yet')}
        </p>
      ) : (
        <div>
          {transactions.map(tx => {
            const typeConfig = {
              sent: {
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                icon: 'fa-arrow-up',
                label: t('web3:transaction.sent', 'Sent'),
                addressLabel: 'To:',
              },
              received: {
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                icon: 'fa-arrow-down',
                label: t('web3:transaction.received', 'Received'),
                addressLabel: 'From:',
              },
              minted: {
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                icon: 'fa-coins',
                label: t('web3:transaction.minted', 'Minted'),
                addressLabel: null,
              },
              sold: {
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                icon: 'fa-fire',
                label: t('web3:transaction.sold', 'Sold'),
                addressLabel: null,
              },
            }[tx.type];

            return (
              <div
                key={tx.hash}
                className={`transaction-entry ${typeConfig.bgColor}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${typeConfig.color} bg-white shadow-sm`}
                    >
                      <i className={`fas ${typeConfig.icon}`}></i>
                    </div>
                    <div>
                      <span className={`font-semibold ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(tx.timestamp * 1000).toLocaleString('bg-BG')}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-lg">
                    {formatValue(tx.value)}
                  </span>
                </div>
                {typeConfig.addressLabel && (
                  <div className="text-sm text-gray-600 pl-13">
                    <p>
                      {typeConfig.addressLabel}{' '}
                      {formatAddress(tx.type === 'sent' ? tx.to : tx.from)}
                    </p>
                  </div>
                )}
                <a
                  href={`https://arbiscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2 inline-block"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  View on Arbiscan
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
