import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../../hooks/useWeb3';
import { useToken } from '../../../hooks/useToken';
import { useTokenContext } from '../../../contexts/TokenContext';
import { useAppState } from '../../../contexts/AppContext';
import { QRCodeSVG } from 'qrcode.react';

export const WalletConnect: React.FC = () => {
  const { t } = useTranslation();
  const { connectWallet, disconnectWallet, loading, isReconnecting } =
    useWeb3();
  const { formattedBalance, loading: tokenLoading, refresh } = useToken();
  const { selectedToken } = useTokenContext();
  const { user } = useAppState();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

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
        <div className="connected-wallet">
          <div
            className="flex items-center justify-between cursor-pointer p-3 -m-3 mb-3 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <h3 className="text-lg font-semibold flex items-center">
              <i className="fas fa-wallet mr-2 text-green-600"></i>
              {t('web3:wallet.title', 'Портфейл')}
            </h3>
            <button
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isOpen ? t('common:hide') : t('common:show')}
            >
              <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
            </button>
          </div>

          {isOpen &&
            (tokenLoading ? (
              <div className="loader-container">
                <div className="red-loader"></div>
              </div>
            ) : (
              <div>
                <p className="flex items-center justify-center mb-4">
                  <i className="fas fa-check-circle text-green-500 mr-2"></i>
                  {t('web3:wallet.connected')}
                </p>

                {/* QR Code Display - Always Visible */}
                <div className="flex justify-center mb-3">
                  <div className="bg-white p-3 rounded-xl border-2 border-gray-200 shadow-sm">
                    <QRCodeSVG
                      value={user.address}
                      size={160}
                      level="H"
                      includeMargin={true}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mb-3">
                  <p className="address text-sm font-mono">
                    {user.address.substring(0, 15)}...
                    {user.address.substring(30)}
                  </p>
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
                    {copiedAddress ? 'Копирано!' : 'Копирай'}
                  </button>
                </div>
                <p className="balance">
                  {formattedBalance} {selectedToken}
                </p>
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
            ))}
        </div>
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
