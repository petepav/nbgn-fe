import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../../hooks/useWeb3';
import { useNBGN } from '../../../hooks/useNBGN';
import { useAppState } from '../../../contexts/AppContext';

export const WalletConnect: React.FC = () => {
  const { t } = useTranslation();
  const { connectWallet, disconnectWallet, loading, isReconnecting } = useWeb3();
  const { formattedBalance, loading: nbgnLoading, refresh } = useNBGN();
  const { user } = useAppState();

  // Show reconnecting state while checking for previous connections
  if (isReconnecting) {
    return (
      <div className="wallet-connect">
        <div className="loader-container">
          <div className="red-loader"></div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          🔄 Checking for previous wallet connection...
        </p>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      {user.address ? (
        nbgnLoading ? (
          <div className="loader-container">
            <div className="red-loader"></div>
          </div>
        ) : (
          <div className="connected-wallet">
            <p className="flex items-center justify-center">
              <i className="fas fa-check-circle text-green-500 mr-2"></i>
              {t('web3:wallet.connected')}
            </p>
            <p className="address">{user.address.substring(0, 6)}...{user.address.substring(38)}</p>
            <p className="balance">
              {formattedBalance}
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={refresh} className="refresh-button" title="Refresh balance">
                🔄
              </button>
              <button onClick={disconnectWallet}>
                {t('web3:wallet.disconnect')}
              </button>
            </div>
          </div>
        )
      ) : (
        <button 
          onClick={() => connectWallet(false)} 
          disabled={loading}
          className="connect-button"
        >
          {loading ? t('web3:wallet.connecting') : t('web3:wallet.connect')}
        </button>
      )}
    </div>
  );
};