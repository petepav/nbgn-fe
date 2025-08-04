import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WalletConnect } from './Web3/WalletConnect';
import { NBGNTransfer } from './Web3/NBGNTransfer';
import { TokenTrade } from './Web3/TokenTrade';
import { TransactionHistory } from './Web3/TransactionHistory';
// import { VoucherWidget } from './Voucher/VoucherWidget';
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

import styles from './TokenInfoExplainer/TokenInfoExplainer.module.css';

export const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { selectedToken } = useTokenContext();
  // const { chainId, switchToArbitrum } = useWeb3();
  const [activeWidget, setActiveWidget] = useState<
    'send' | 'history' | 'trade' // | 'voucher'
  >('trade');
  const [prefilledRecipient, setPrefilledRecipient] = useState<string>('');
  const [prefilledAmount, setPrefilledAmount] = useState<string>('');
  const [addressCopied, setAddressCopied] = useState(false);

  const handleNavigateToSend = (address: string, amount?: string) => {
    setPrefilledRecipient(address);
    if (amount) {
      setPrefilledAmount(amount);
    }
    setActiveWidget('send');
  };

  const handleWidgetChange = (
    widget: 'send' | 'history' | 'trade' // | 'voucher'
  ) => {
    if (widget !== 'send') {
      setPrefilledRecipient('');
      setPrefilledAmount('');
    }
    setActiveWidget(widget);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-controls">
          <LanguageSwitcher />
        </div>
        <div
          className="header-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            //justifyContent: 'center',
            //gap: '20px',
            //marginBottom: '32px',
            //marginTop: '60px',
            //paddingTop: '20px',
            marginTop: '-10px',
            width: '100%',
          }}
        >
          <img
            src="/lion_head_black_no_bg.png"
            alt="NBGN Lion"
            style={{
              width: '80px',
              height: '80px',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
            }}
          />
          <h1
            style={{
              //fontSize: '56px',
              fontSize: '50px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              letterSpacing: '-3px',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textTransform: 'uppercase',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            NBGN
          </h1>
        </div>

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
            <div
              style={{
                marginTop: '40px',
                marginBottom: '20px',
                width: '90vw',
                maxWidth: '1200px',
              }}
            >
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
            <div style={{ width: '90vw', maxWidth: '1200px' }}>
              <div
                className="token-selector-container"
                style={{ marginTop: '20px', marginBottom: '20px' }}
              >
                <TokenSelector />
              </div>

              <TokenInfoExplainer />

              <MoneriumExplainer isVisible={selectedToken === 'NBGN'} />

              <WalletConnect key={user.address || 'wallet-connected'} />
            </div>
          </>
        )}

        {user.address && (
          <>
            <div
              className="mt-8 w-full"
              style={{ width: '90vw', maxWidth: '1200px' }}
            >
              {/* Network Warning for selected token */}
              <NetworkWarning />

              {/* Widget Content */}
              {activeWidget === 'send' && (
                <NBGNTransfer
                  initialRecipient={prefilledRecipient}
                  initialAmount={prefilledAmount}
                />
              )}
              {activeWidget === 'trade' && <TokenTrade />}
              {activeWidget === 'history' && (
                <TransactionHistory onNavigateToSend={handleNavigateToSend} />
              )}
              {/* {activeWidget === 'voucher' && <VoucherWidget />} */}

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
            ⚠️ NBGN е частен токен, няма връзка с БНБ или официалната валута.
            Участието е изцяло на собствен риск.
            <a href="/disclaimer" className="disclaimer-link">
              Виж пълния дисклеймър тук. 🔗
            </a>
          </p>

          <div
            className="sponsor-section"
            style={{ marginTop: '16px', marginBottom: '16px' }}
          >
            <button
              onClick={() =>
                handleNavigateToSend(
                  '0x2844ee586336982fd6F20345f8eA0236608bc3E8',
                  '5'
                )
              }
              className="sponsor-link"
              style={{
                background: 'linear-gradient(135deg, #a0826d, #8b6f47)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 4px 16px rgba(139, 111, 71, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 2px 8px rgba(139, 111, 71, 0.3)';
              }}
            >
              <span>
                {t('common:sponsorProject', 'Sponsor the NBGN project')}
              </span>
              <span style={{ fontSize: '18px' }}>☕</span>
            </button>
            <div
              style={{
                marginTop: '12px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  marginBottom: '8px',
                }}
              >
                {t(
                  'common:acceptedDonations',
                  'We accept NBGN, EURe, DBGN, GBGN, USDC, ETH, WBTC but all donations are welcome'
                )}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f9fa',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                <span style={{ color: '#475569' }}>
                  0x2844ee586336982fd6F20345f8eA0236608bc3E8
                </span>
                <button
                  onClick={() => {
                    void window.navigator.clipboard.writeText(
                      '0x2844ee586336982fd6F20345f8eA0236608bc3E8'
                    );
                    setAddressCopied(true);
                    window.setTimeout(() => setAddressCopied(false), 2000);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: addressCopied ? '#10b981' : '#ec4899',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!addressCopied) {
                      e.currentTarget.style.color = '#f43f5e';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!addressCopied) {
                      e.currentTarget.style.color = '#ec4899';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  title={t('common:copyAddress', 'Copy address')}
                >
                  <i
                    className={addressCopied ? 'fas fa-check' : 'fas fa-copy'}
                  ></i>
                </button>
                <a
                  href="https://arbiscan.io/address/0x2844ee586336982fd6F20345f8eA0236608bc3E8"
                  target="_blank"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f8f9fa',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    marginLeft: '-10px',
                  }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </div>
            </div>
          </div>

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
          <div>
            <br />
            <a
              href="https://arbiscan.io/token/0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              NBGN Token
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
