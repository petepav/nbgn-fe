import React, { useState, useRef, useEffect } from 'react';
import { useTokenContext } from '../../contexts/TokenContext';
import { useToast } from '../../contexts/ToastContext';
import styles from './TokenSelector.module.css';

const TokenSelector: React.FC = () => {
  const {
    selectedToken,
    selectToken,
    supportedTokens,
    getTokenBalance,
    isCorrectNetwork,
    switchToTokenNetwork,
  } = useTokenContext();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentToken =
    selectedToken === 'NBGN'
      ? supportedTokens.NBGN
      : selectedToken === 'DBGN'
        ? supportedTokens.DBGN
        : selectedToken === 'GBGN'
          ? supportedTokens.GBGN
          : supportedTokens.NBGN;
  const balance = getTokenBalance(selectedToken);
  const correctNetwork = isCorrectNetwork(selectedToken);
  const [currentChainId, setCurrentChainId] = useState<number | undefined>();

  useEffect(() => {
    const getChainId = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          });
          setCurrentChainId(parseInt(chainId, 16));
        } catch (error) {
          console.error('Error getting chain ID:', error);
        }
      }
    };
    void getChainId();
  }, []);

  const handleTokenSelect = async (symbol: string) => {
    // Check if we need to switch networks
    if (!isCorrectNetwork(symbol)) {
      // Special case for GBGN on Arbitrum
      if (symbol === 'GBGN' && currentChainId === 42161) {
        showToast(
          'You have to switch your network to Ethereum mainnet before using GBGN',
          'error',
          5000
        );
        setIsOpen(false);
        return;
      }

      setIsSwitching(true);
      try {
        await switchToTokenNetwork(symbol);
        selectToken(symbol);
      } catch (error) {
        console.error('Failed to switch network:', error);
        showToast(
          'Failed to switch network. Please switch manually in your wallet.',
          'error'
        );
      } finally {
        setIsSwitching(false);
      }
    } else {
      selectToken(symbol);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.tokenSelector} ref={dropdownRef}>
      <button
        className={`${styles.tokenSelectorButton} ${!correctNetwork ? styles.wrongNetwork : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: currentToken.color }}
      >
        <div
          className={styles.tokenIcon}
          style={{ backgroundColor: currentToken.color }}
        >
          {currentToken.symbol.charAt(0)}
        </div>
        <div className={styles.tokenInfo}>
          <span className={styles.tokenSymbol}>{currentToken.symbol}</span>
          {correctNetwork ? (
            <span className={styles.tokenBalance}>
              {balance.formattedBalance}
            </span>
          ) : (
            <span className={styles.networkWarning}>Wrong Network</span>
          )}
        </div>
        <svg
          className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
        >
          <path
            d="M1 1l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.tokenDropdown}>
          {isSwitching && (
            <div className={styles.switchingOverlay}>
              <div className={styles.switchingContent}>
                <div className={styles.spinner}></div>
                <span>Switching network...</span>
              </div>
            </div>
          )}
          {Object.entries(supportedTokens).map(([symbol, config]) => {
            const tokenBalance = getTokenBalance(symbol);
            const isTokenCorrectNetwork = isCorrectNetwork(symbol);
            return (
              <button
                key={symbol}
                className={`${styles.tokenOption} ${symbol === selectedToken ? styles.selected : ''}`}
                onClick={() => handleTokenSelect(symbol)}
                disabled={isSwitching}
              >
                <div
                  className={styles.tokenIcon}
                  style={{ backgroundColor: config.color }}
                >
                  {config.symbol.charAt(0)}
                </div>
                <div className={styles.tokenOptionInfo}>
                  <div className={styles.tokenHeader}>
                    <span className={styles.tokenSymbol}>{config.symbol}</span>
                    <span
                      className={styles.chainBadge}
                      style={{
                        backgroundColor:
                          config.chainId === 1 ? '#e3f2fd' : '#f3e5f5',
                        color: config.chainId === 1 ? '#1976d2' : '#7b1fa2',
                      }}
                    >
                      {config.chainId === 1 ? 'Ethereum' : 'Arbitrum'}
                    </span>
                  </div>
                  <div className={styles.tokenDetails}>
                    <span className={styles.tokenName}>{config.name}</span>
                    {isTokenCorrectNetwork ? (
                      <span className={styles.tokenBalanceSmall}>
                        {tokenBalance.formattedBalance}
                      </span>
                    ) : (
                      <span className={styles.tokenPeg}>
                        1 {config.pegAsset} ={' '}
                        {config.pegAsset === 'PAXG'
                          ? config.pegRate.toLocaleString()
                          : config.pegRate}{' '}
                        {config.symbol}
                      </span>
                    )}
                  </div>
                </div>
                {symbol === selectedToken && (
                  <svg
                    className={styles.checkIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M2 8l4 4 8-8"
                      stroke={config.color}
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TokenSelector;
