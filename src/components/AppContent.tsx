import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WalletConnect } from './Web3/WalletConnect';
import { NBGNTransfer } from './Web3/NBGNTransfer';
import { NBGNExchange } from './Web3/NBGNExchange';
import { NBGNRedeem } from './Web3/NBGNRedeem';
import { TransactionHistory } from './Web3/TransactionHistory';
import { ChainWarning } from './Web3/ChainWarning';
import { LanguageSwitcher } from './LanguageSwitcher';
import { VersionInfo } from './VersionInfo';
import { MobileWarning } from './MobileWarning';
import { useAppState } from '../contexts/AppContext';
import { useWeb3 } from '../hooks/useWeb3';

export const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { chainId, switchToArbitrum } = useWeb3();
  const [activeWidget, setActiveWidget] = useState<
    'send' | 'history' | 'exchange' | 'redeem'
  >('send');
  const [prefilledRecipient, setPrefilledRecipient] = useState<string>('');

  const handleNavigateToSend = (address: string) => {
    setPrefilledRecipient(address);
    setActiveWidget('send');
  };

  const handleWidgetChange = (
    widget: 'send' | 'history' | 'exchange' | 'redeem'
  ) => {
    if (widget !== 'send') {
      setPrefilledRecipient('');
    }
    setActiveWidget(widget);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-controls">
          <LanguageSwitcher />
        </div>
        <h1>{t('common:welcome')}</h1>

        <div className="info-nav">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <Link to="/info" className="info-nav-link">
              <i className="fas fa-book-open mr-2"></i>
              Информация и упътване 📖
            </Link>
            {user.address && (
              <Link
                to="/ramp"
                className="info-nav-link bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                <i className="fas fa-credit-card mr-2"></i>
                Купи NBGN с карта 💳
              </Link>
            )}
          </div>
        </div>

        <MobileWarning />

        <WalletConnect />

        {user.address && (
          <div className="mt-8 w-full max-w-2xl">
            {/* Chain Warning */}
            <ChainWarning
              currentChainId={chainId}
              onSwitchChain={switchToArbitrum}
            />
            {/* Widget Toggle Buttons */}
            <div className="flex justify-center gap-6 mb-8 flex-wrap">
              <button
                onClick={() => handleWidgetChange('send')}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 min-w-[140px] ${
                  activeWidget === 'send'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-xl scale-105 border-2 border-green-700'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400 hover:text-green-600 hover:shadow-lg'
                }`}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                {t('web3:transaction.send', 'Send')}
              </button>

              <button
                onClick={() => handleWidgetChange('exchange')}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 min-w-[140px] ${
                  activeWidget === 'exchange'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl scale-105 border-2 border-blue-700'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:shadow-lg'
                }`}
              >
                <i className="fas fa-coins mr-2"></i>
                {t('web3:exchange.shortTitle', 'Buy')}
              </button>

              <button
                onClick={() => handleWidgetChange('redeem')}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 min-w-[140px] ${
                  activeWidget === 'redeem'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-xl scale-105 border-2 border-red-700'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400 hover:text-red-600 hover:shadow-lg'
                }`}
              >
                <i className="fas fa-fire mr-2"></i>
                {t('web3:redeem.shortTitle', 'Sell')}
              </button>

              <button
                onClick={() => handleWidgetChange('history')}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 min-w-[140px] ${
                  activeWidget === 'history'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-xl scale-105 border-2 border-gray-700'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:text-gray-600 hover:shadow-lg'
                }`}
              >
                <i className="fas fa-clock-rotate-left mr-2"></i>
                {t('web3:transaction.historyShort', 'History')}
              </button>
            </div>

            {/* Widget Content */}
            {activeWidget === 'send' && (
              <NBGNTransfer initialRecipient={prefilledRecipient} />
            )}
            {activeWidget === 'exchange' && <NBGNExchange />}
            {activeWidget === 'redeem' && <NBGNRedeem />}
            {activeWidget === 'history' && (
              <TransactionHistory onNavigateToSend={handleNavigateToSend} />
            )}
          </div>
        )}
      </header>

      <VersionInfo />

      <footer className="disclaimer-footer">
        <div className="disclaimer-content">
          <p className="disclaimer-short">
            ⚠️ nbgn е частен токен, няма връзка с БНБ или официалната валута.
            Участието е изцяло на собствен риск.
            <a href="/disclaimer" className="disclaimer-link">
              Виж пълния дисклеймър тук. 🔗
            </a>
          </p>

          <div className="footer-links">
            <a
              href="https://discord.gg/ereWXZWMvj"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <i className="fab fa-discord mr-2"></i>
              Discord
            </a>
            <a
              href="https://github.com/pete-fathom/nbgn-fe"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <i className="fab fa-github mr-2"></i>
              Frontend
            </a>
            <a
              href="https://github.com/pete-fathom/nbgn"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <i className="fab fa-github mr-2"></i>
              Contract
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
