import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WalletConnect } from './Web3/WalletConnect';
import { NBGNTransfer } from './Web3/NBGNTransfer';
import { TokenTrade } from './Web3/TokenTrade';
import { TransactionHistory } from './Web3/TransactionHistory';
import { LanguageSwitcher } from './LanguageSwitcher';
import { VersionInfo } from './VersionInfo';
import { MobileWarning } from './MobileWarning';
import TokenSelector from './TokenSelector';
import { NetworkWarning } from './NetworkWarning';
import MoneriumExplainer from './MoneriumExplainer';
import TokenInfoExplainer from './TokenInfoExplainer';
import { useAppState } from '../contexts/AppContext';
import { useTokenContext } from '../contexts/TokenContext';
import { BottomNavigation } from './BottomNavigation';

export const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { selectedToken } = useTokenContext();
  // const { chainId, switchToArbitrum } = useWeb3();
  const [activeWidget, setActiveWidget] = useState<
    'send' | 'history' | 'trade'
  >('send');
  const [prefilledRecipient, setPrefilledRecipient] = useState<string>('');

  const handleNavigateToSend = (address: string) => {
    setPrefilledRecipient(address);
    setActiveWidget('send');
  };

  const handleWidgetChange = (widget: 'send' | 'history' | 'trade') => {
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
          </div>
        </div>

        <MobileWarning />

        {!user.address ? (
          // Show wallet connect first if not connected
          <>
            <div style={{ marginTop: '40px', marginBottom: '20px' }}>
              <h2
                style={{
                  fontSize: '24px',
                  marginBottom: '20px',
                  color: '#333',
                }}
              >
                {t('common:connectFirst', 'Connect your wallet to get started')}
              </h2>
              <WalletConnect key={user.address || 'no-wallet'} />
            </div>
          </>
        ) : (
          // Show token selector and other components after wallet is connected
          <>
            <div
              className="token-selector-container"
              style={{ marginTop: '20px', marginBottom: '20px' }}
            >
              <TokenSelector />
            </div>

            <TokenInfoExplainer />

            <MoneriumExplainer isVisible={selectedToken === 'NBGN'} />

            <WalletConnect key={user.address || 'wallet-connected'} />
          </>
        )}

        {user.address && (
          <>
            <div className="mt-8 w-full max-w-2xl">
              {/* Network Warning for selected token */}
              <NetworkWarning />

              {/* Widget Content */}
              {activeWidget === 'send' && (
                <NBGNTransfer initialRecipient={prefilledRecipient} />
              )}
              {activeWidget === 'trade' && <TokenTrade />}
              {activeWidget === 'history' && (
                <TransactionHistory onNavigateToSend={handleNavigateToSend} />
              )}

              {/* Bottom Navigation - Positioned after widgets */}
              <BottomNavigation
                activeWidget={activeWidget}
                onWidgetChange={handleWidgetChange}
                selectedToken={selectedToken}
              />
            </div>
          </>
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
              Contracts
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
