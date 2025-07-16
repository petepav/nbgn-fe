import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTokenContext } from '../../contexts/TokenContext';
import styles from './TokenInfoExplainer.module.css';

const TokenInfoExplainer: React.FC = () => {
  const { t } = useTranslation();
  const { selectedToken, getTokenConfig } = useTokenContext();
  const [isOpen, setIsOpen] = useState(true);
  const [addingToMetaMask, setAddingToMetaMask] = useState(false);

  const tokenConfig = getTokenConfig();

  const getExplorerUrl = () => {
    if (tokenConfig.chainId === 1) {
      return `https://etherscan.io/token/${tokenConfig.address}`;
    } else if (tokenConfig.chainId === 42161) {
      return `https://arbiscan.io/token/${tokenConfig.address}`;
    }
    return '#';
  };

  const formatPegRate = () => {
    if (tokenConfig.symbol === 'NBGN') {
      return `1 ${tokenConfig.pegAsset} = 1.95583 ${tokenConfig.symbol}`;
    } else if (tokenConfig.symbol === 'DBGN') {
      return `1 USD = ${(1 / tokenConfig.pegRate).toFixed(4)} ${tokenConfig.symbol}`;
    } else if (tokenConfig.symbol === 'GBGN') {
      return `1 ${tokenConfig.pegAsset} = ${tokenConfig.pegRate.toLocaleString()} ${tokenConfig.symbol}`;
    }
    return '';
  };

  const addTokenToMetaMask = async () => {
    if (!window.ethereum) {
      alert(t('tokenInfo.metaMaskNotFound'));
      return;
    }

    setAddingToMetaMask(true);
    try {
      // @ts-ignore
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenConfig.address,
            symbol: tokenConfig.symbol,
            decimals: tokenConfig.decimals,
            image: `${window.location.origin}${tokenConfig.icon}`,
          },
        },
      });

      if (wasAdded) {
        console.log(`${tokenConfig.symbol} was added to MetaMask`);
      }
    } catch (error) {
      console.error(`Failed to add ${tokenConfig.symbol} to MetaMask:`, error);
    } finally {
      setAddingToMetaMask(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <h3 className={styles.title}>
          {t('tokenInfo.title', { token: selectedToken })}
        </h3>
        <button
          className={styles.toggleButton}
          aria-label={isOpen ? t('tokenInfo.hide') : t('tokenInfo.show')}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>
      {isOpen && (
        <div className={styles.content}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('tokenInfo.name')}:</span>
              <span className={styles.value}>{tokenConfig.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('tokenInfo.peggedTo')}:</span>
              <span className={styles.value}>{tokenConfig.pegAsset}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>
                {t('tokenInfo.exchangeRate')}:
              </span>
              <span className={styles.value}>{formatPegRate()}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>{t('tokenInfo.network')}:</span>
              <span className={styles.value}>{tokenConfig.chainName}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <a
              href={getExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {t('tokenInfo.viewContract')}
            </a>
            <button
              onClick={addTokenToMetaMask}
              disabled={addingToMetaMask}
              className={styles.addButton}
            >
              {addingToMetaMask
                ? t('tokenInfo.adding')
                : t('tokenInfo.addToMetaMask')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenInfoExplainer;
