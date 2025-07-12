import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../../hooks/useWeb3';
import { useNBGN } from '../../../hooks/useNBGN';
import { useAppState } from '../../../contexts/AppContext';

export const WalletConnect: React.FC = () => {
  const { t } = useTranslation();
  const { connectWallet, disconnectWallet, loading, isReconnecting } = useWeb3();
  const { formattedBalance, loading: nbgnLoading, refresh } = useNBGN();
  const { user } = useAppState();
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!user.address) return;
    
    try {
      // eslint-disable-next-line no-undef
      await navigator.clipboard.writeText(user.address);
      setCopiedAddress(true);
      // eslint-disable-next-line no-undef
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      // Fallback for older browsers
      // eslint-disable-next-line no-undef
      const textArea = document.createElement('textarea');
      textArea.value = user.address;
      // eslint-disable-next-line no-undef
      document.body.appendChild(textArea);
      textArea.select();
      // eslint-disable-next-line no-undef
      document.execCommand('copy');
      // eslint-disable-next-line no-undef
      document.body.removeChild(textArea);
      setCopiedAddress(true);
      // eslint-disable-next-line no-undef
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

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
            <div className="flex items-center justify-center gap-3 mb-3">
              <p className="address text-sm font-mono">{user.address.substring(0, 6)}...{user.address.substring(38)}</p>
              <button
                onClick={copyAddress}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm ${
                  copiedAddress
                    ? 'bg-green-50 border-green-200 text-green-700 shadow-green-100' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-md'
                }`}
                title={copiedAddress ? 'Copied!' : 'Copy address'}
              >
                <i className={`fas ${copiedAddress ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                {copiedAddress ? 'Copied!' : 'Copy'}
              </button>
            </div>
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