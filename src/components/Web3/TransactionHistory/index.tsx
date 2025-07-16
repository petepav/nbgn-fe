import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToken } from '../../../hooks/useToken';
import { useTokenContext } from '../../../contexts/TokenContext';
import { useAppState } from '../../../contexts/AppContext';
import { ethers } from 'ethers';
import { EURE_ABI } from '../../../contracts/abis/EURe';
import { EURC_ABI } from '../../../contracts/abis/EURC';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  type: 'sent' | 'received' | 'minted' | 'sold';
  eureAmount?: string;
  gasUsed?: string;
  gasPrice?: string;
  transactionFee?: string;
}

interface TransactionHistoryProps {
  // eslint-disable-next-line no-unused-vars
  onNavigateToSend?: (address: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  onNavigateToSend,
}) => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { web3 } = useAppState();
  const { getContract } = useToken();
  const { selectedToken, getTokenConfig } = useTokenContext();
  const tokenConfig = getTokenConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const TRANSACTIONS_PER_PAGE = 20;

  // Copy address to clipboard with visual feedback
  const copyToClipboard = async (address: string) => {
    try {
      // eslint-disable-next-line no-undef
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      // Clear the feedback after 2 seconds
      // eslint-disable-next-line no-undef
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // Fallback for older browsers
      // eslint-disable-next-line no-undef
      const textArea = document.createElement('textarea');
      textArea.value = address;
      // eslint-disable-next-line no-undef
      document.body.appendChild(textArea);
      textArea.select();
      // eslint-disable-next-line no-undef
      document.execCommand('copy');
      // eslint-disable-next-line no-undef
      document.body.removeChild(textArea);
      setCopiedAddress(address);
      // eslint-disable-next-line no-undef
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  // Helper function to get stable token contract
  const getStableTokenContract = useCallback(async () => {
    if (!web3.provider || !tokenConfig.stableTokenAddress) return null;
    try {
      const signer = await web3.provider.getSigner();
      const abi =
        tokenConfig.stableTokenSymbol === 'EURe' ? EURE_ABI : EURC_ABI;
      return new ethers.Contract(tokenConfig.stableTokenAddress, abi, signer);
    } catch {
      return null;
    }
  }, [
    web3.provider,
    tokenConfig.stableTokenAddress,
    tokenConfig.stableTokenSymbol,
  ]);

  // Function to enrich transactions with EURe amounts and transaction fees
  const enrichTransactionsWithDetails = useCallback(
    async (transactions: Transaction[]) => {
      if (!web3.provider) return;

      for (const tx of transactions) {
        try {
          // Get transaction receipt for fee information
          const receipt = await web3.provider.getTransactionReceipt(tx.hash);
          if (receipt) {
            const gasUsed = receipt.gasUsed.toString();
            const fullTx = await web3.provider.getTransaction(tx.hash);
            if (fullTx) {
              const gasPrice = fullTx.gasPrice?.toString() || '0';
              const fee = (BigInt(gasUsed) * BigInt(gasPrice)).toString();

              tx.gasUsed = gasUsed;
              tx.gasPrice = gasPrice;
              tx.transactionFee = ethers.formatEther(fee);
            }
          }

          // For minted/sold transactions, try to find corresponding EURe transfer
          if (tx.type === 'minted' || tx.type === 'sold') {
            try {
              const stableContract = await getStableTokenContract();
              if (stableContract && receipt) {
                // Look for stable token Transfer events in the same transaction
                const transferFilter = stableContract.filters.Transfer();
                const events = await stableContract.queryFilter(
                  transferFilter,
                  receipt.blockNumber,
                  receipt.blockNumber
                );

                // Find stable token transfer in the same transaction
                const stableTransfer = events.find(
                  event => event.transactionHash === tx.hash
                );

                if (
                  stableTransfer &&
                  'args' in stableTransfer &&
                  Array.isArray(stableTransfer.args)
                ) {
                  const stableArgs = stableTransfer.args as string[];
                  const decimals =
                    tokenConfig.stableTokenSymbol === 'USDC' ? 6 : 18;
                  const stableAmount = ethers.formatUnits(
                    stableArgs[2],
                    decimals
                  );

                  // For minted transactions, user pays stable token (from user to contract)
                  // For sold transactions, user receives stable token (from contract to user)
                  if (tx.type === 'minted' || tx.type === 'sold') {
                    tx.eureAmount = stableAmount;
                  }
                }
              }
            } catch {
              // Silent error handling for EURe amount fetching
            }
          }
        } catch {
          // Silent error handling for transaction enrichment
        }
      }
    },
    [web3.provider, getStableTokenContract, tokenConfig.stableTokenSymbol]
  );

  const fetchTransactions = useCallback(
    async (page = 0, append = false) => {
      if (!user.address || !web3.provider) return;

      let contract;
      try {
        if (page === 0) {
          setLoading(true);
          setTransactions([]);
          setCurrentPage(0);
          setTotalFound(0);
        } else {
          setLoadingMore(true);
        }

        contract = await getContract();
        if (!contract) return;

        // Get the current block number
        const currentBlock = await web3.provider.getBlockNumber();

        // For comprehensive history, we'll fetch in chunks from deployment block
        // Start from a reasonable deployment block (you can adjust this)
        const deploymentBlock = 150000000; // Approximate NBGN deployment block on Arbitrum
        const fromBlock = Math.max(deploymentBlock, currentBlock - 1000000); // Look back up to 1M blocks

        // Create filters for sent and received transactions
        const sentFilter = contract.filters.Transfer(user.address, null);
        const receivedFilter = contract.filters.Transfer(null, user.address);

        // Fetch events in batches to avoid RPC limits
        const batchSize = 100000; // 100k blocks per batch
        const allEvents = [];

        for (
          let startBlock = fromBlock;
          startBlock <= currentBlock;
          startBlock += batchSize
        ) {
          const endBlock = Math.min(startBlock + batchSize - 1, currentBlock);

          try {
            const [sentBatch, receivedBatch] = await Promise.all([
              contract.queryFilter(sentFilter, startBlock, endBlock),
              contract.queryFilter(receivedFilter, startBlock, endBlock),
            ]);

            allEvents.push(...sentBatch, ...receivedBatch);
          } catch {
            // If batch fails, try smaller chunks
            continue;
          }
        }

        // Process events into transactions
        const processedTxs: Transaction[] = [];
        const seenHashes = new Set<string>();

        for (const event of allEvents) {
          if (
            'args' in event &&
            !seenHashes.has(event.transactionHash) &&
            Array.isArray(event.args)
          ) {
            seenHashes.add(event.transactionHash);
            const args = event.args as string[];
            processedTxs.push({
              hash: event.transactionHash,
              from: args[0],
              to: args[1],
              value: args[2].toString(),
              blockNumber: event.blockNumber,
              timestamp: 0, // We'll fetch timestamps on demand
              type: getTransactionType(args[0], args[1], user.address) as
                | 'sent'
                | 'received'
                | 'minted',
            });
          }
        }

        // Sort by block number (most recent first)
        processedTxs.sort((a, b) => b.blockNumber - a.blockNumber);

        setTotalFound(processedTxs.length);

        // If no transactions found, set empty state and return
        if (processedTxs.length === 0) {
          setTransactions([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }

        // Paginate results
        const startIndex = page * TRANSACTIONS_PER_PAGE;
        const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
        const paginatedTxs = processedTxs.slice(startIndex, endIndex);

        // Enrich transactions with EURe amounts and fees
        await enrichTransactionsWithDetails(paginatedTxs);

        // Fetch timestamps for the current page
        for (const tx of paginatedTxs) {
          if (tx.timestamp === 0) {
            try {
              const block = await web3.provider.getBlock(tx.blockNumber);
              tx.timestamp = block?.timestamp || 0;
            } catch {
              tx.timestamp = 0;
            }
          }
        }

        if (append) {
          setTransactions(prev => [...prev, ...paginatedTxs]);
        } else {
          setTransactions(paginatedTxs);
        }

        setCurrentPage(page);
        setHasMore(endIndex < processedTxs.length);
      } catch {
        // Silent error handling
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.address, web3.provider]
  );

  const loadMoreTransactions = () => {
    if (!loadingMore && hasMore) {
      void fetchTransactions(currentPage + 1, true);
    }
  };

  useEffect(() => {
    void fetchTransactions(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken, user.address]);

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
    const tokenValue = ethers.formatUnits(value, tokenConfig.decimals);
    const numValue = parseFloat(tokenValue);

    if (isNaN(numValue)) return `0.00 ${selectedToken}`;

    return `${numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${selectedToken}`;
  };

  const formatStableToken = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `0.00 ${tokenConfig.stableTokenSymbol}`;

    const formatted = numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${formatted} ${tokenConfig.stableTokenSymbol}`;
  };

  const formatFee = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0,0000 ETH';

    return (
      numValue.toLocaleString('en-US', {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      }) + ' ETH'
    );
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          <i className="fas fa-clock-rotate-left mr-2 text-green-600"></i>
          {t('web3:transaction.history', 'Transaction History')}
        </h3>
        {totalFound > 0 && (
          <span className="text-sm text-gray-500">
            {totalFound} {totalFound === 1 ? 'transaction' : 'transactions'}{' '}
            found
          </span>
        )}
      </div>

      {!loading && transactions.length === 0 ? (
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
                    <div className="flex items-center gap-2">
                      <span>{typeConfig.addressLabel}</span>
                      <div className="flex items-center gap-1">
                        {onNavigateToSend ? (
                          <button
                            onClick={() =>
                              onNavigateToSend(
                                tx.type === 'sent' ? tx.to : tx.from
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                            title="Click to send to this address"
                          >
                            {formatAddress(
                              tx.type === 'sent' ? tx.to : tx.from
                            )}
                          </button>
                        ) : (
                          <span className="font-medium">
                            {formatAddress(
                              tx.type === 'sent' ? tx.to : tx.from
                            )}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            copyToClipboard(
                              tx.type === 'sent' ? tx.to : tx.from
                            )
                          }
                          className={`ml-2 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 border ${
                            copiedAddress ===
                            (tx.type === 'sent' ? tx.to : tx.from)
                              ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 hover:shadow-sm'
                          }`}
                          title={
                            copiedAddress ===
                            (tx.type === 'sent' ? tx.to : tx.from)
                              ? 'Копирано!'
                              : 'Copy address'
                          }
                        >
                          <i
                            className={`fas ${
                              copiedAddress ===
                              (tx.type === 'sent' ? tx.to : tx.from)
                                ? 'fa-check'
                                : 'fa-copy'
                            } mr-1`}
                          ></i>
                          {copiedAddress ===
                          (tx.type === 'sent' ? tx.to : tx.from)
                            ? 'Копирано!'
                            : 'Копирай'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stable Token Amount and Transaction Fee */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  {tx.eureAmount && parseFloat(tx.eureAmount) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center">
                        <i className="fas fa-euro-sign mr-2 text-blue-600"></i>
                        {tx.type === 'minted'
                          ? `${tokenConfig.stableTokenSymbol} Paid:`
                          : tx.type === 'sold'
                            ? `${tokenConfig.stableTokenSymbol} Received:`
                            : `${tokenConfig.stableTokenSymbol} Amount:`}
                      </span>
                      <span className="font-semibold text-blue-700">
                        {formatStableToken(tx.eureAmount)}
                      </span>
                    </div>
                  )}
                  {tx.transactionFee && parseFloat(tx.transactionFee) > 0 && (
                    <div className="flex justify-between items-center text-xs opacity-75">
                      <span className="text-gray-500 flex items-center text-xs">
                        <i className="fas fa-gas-pump mr-1 text-gray-400 text-xs"></i>
                        <span className="text-xs">Fee: </span>
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatFee(tx.transactionFee)}
                      </span>
                    </div>
                  )}
                </div>

                <a
                  href={`https://arbiscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600 mt-3 inline-block"
                >
                  <i className="fas fa-external-link-alt mr-1"></i>
                  View on Arbiscan
                </a>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMoreTransactions}
                disabled={loadingMore}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-chevron-down mr-2"></i>
                    Load More Transactions
                  </>
                )}
              </button>
            </div>
          )}

          {/* Show current progress */}
          {transactions.length > 0 && totalFound > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {transactions.length} of {totalFound} transactions
            </div>
          )}
        </div>
      )}
    </div>
  );
};
