import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../../hooks/useWeb3';
import { useNBGN } from '../../../hooks/useNBGN';
import { useAppState } from '../../../contexts/AppContext';
import { QRCodeSVG } from 'qrcode.react';

export const WalletConnect: React.FC = () => {
  const { t } = useTranslation();
  const { connectWallet, disconnectWallet, loading, isReconnecting } =
    useWeb3();
  const { formattedBalance, loading: nbgnLoading, refresh } = useNBGN();
  const { user } = useAppState();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
              <p className="address text-sm font-mono">
                {user.address.substring(0, 6)}...{user.address.substring(38)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={copyAddress}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm"
                  style={{
                    backgroundColor: copiedAddress
                      ? '#f0fdf4'
                      : isHovered
                        ? '#e5e7eb'
                        : '#f3f4f6',
                    borderColor: copiedAddress
                      ? '#bbf7d0'
                      : isHovered
                        ? '#9ca3af'
                        : '#d1d5db',
                    color: copiedAddress ? '#15803d' : '#374151',
                  }}
                  title={copiedAddress ? 'Copied!' : 'Copy address'}
                >
                  <i
                    className={`fas ${copiedAddress ? 'fa-check' : 'fa-copy'} mr-2`}
                  ></i>
                  {copiedAddress ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm"
                  style={{
                    backgroundColor: '#f3f4f6',
                    borderColor: '#d1d5db',
                    color: '#374151',
                  }}
                  title="Show QR Code"
                >
                  <i className="fas fa-qrcode mr-2"></i>
                  QR
                </button>
              </div>
            </div>
            <p className="balance">{formattedBalance}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={refresh}
                className="refresh-button"
                title="Refresh balance"
              >
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

      {/* QR Code Modal */}
      {showQR && user.address && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                <i className="fas fa-qrcode mr-2 text-blue-600"></i>
                Receive NBGN
              </h3>
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-4">
                <QRCodeSVG
                  value={user.address}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to get my wallet address
              </p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded border break-all mb-4">
                {user.address}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={copyAddress}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i
                    className={`fas ${copiedAddress ? 'fa-check' : 'fa-copy'} mr-2`}
                  ></i>
                  {copiedAddress ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
