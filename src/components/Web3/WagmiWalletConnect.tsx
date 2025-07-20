import React from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName, useBalance } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { formatEther } from 'viem';
import './WalletConnect.css';

export const WagmiWalletConnect: React.FC = () => {
  const { t } = useTranslation();
  const { address, isConnected, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-avatar">
            <i className="fas fa-wallet"></i>
          </div>
          <div className="wallet-details">
            <p className="wallet-address">
              {ensName || truncateAddress(address)}
              <button onClick={copyAddress} className="copy-btn" title={t('common.copy', 'Copy')}>
                <i className="fas fa-copy"></i>
              </button>
            </p>
            {balance && (
              <p className="wallet-balance">
                {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
              </p>
            )}
            {chain && chain.id !== 42161 && (
              <p className="wrong-network">
                {t('wallet.wrongNetwork', 'Please switch to Arbitrum One')}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => disconnect()} className="disconnect-btn">
          {t('wallet.disconnect', 'Disconnect')}
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <h3>{t('wallet.connectTitle', 'Connect Your Wallet')}</h3>
      <p className="connect-description">
        {t('wallet.connectDescription', 'Connect your wallet to start using NBGN vouchers')}
      </p>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error.message}
        </div>
      )}

      <div className="connector-list">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="connector-button"
          >
            <span className="connector-name">{connector.name}</span>
            {isPending && <i className="fas fa-spinner fa-spin"></i>}
          </button>
        ))}
      </div>

      <div className="network-info">
        <i className="fas fa-info-circle"></i>
        <p>{t('wallet.networkInfo', 'This app works on Arbitrum One network')}</p>
      </div>
    </div>
  );
};