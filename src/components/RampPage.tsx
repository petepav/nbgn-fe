import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../contexts/AppContext';
import { useWeb3 } from '../hooks/useWeb3';
import { WalletConnect } from './Web3/WalletConnect';
import { ChainWarning } from './Web3/ChainWarning';
import { useAutoSwap } from '../hooks/useAutoSwap';
import { useRampSwap } from '../hooks/useRampSwap';

export const RampPage: React.FC = () => {
  const { user } = useAppState();
  const { chainId, switchToArbitrum } = useWeb3();
  const [showWidget, setShowWidget] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [checkingBalance, setCheckingBalance] = useState(true);
  const { isMonitoring, swapStatus, startMonitoring, stopMonitoring } =
    useAutoSwap();
  const {
    getUSDCBalance,
    getEUReBalance,
    swapUSDCToEURe,
    mintNBGNFromEURe,
    loading: swapLoading,
  } = useRampSwap();

  const openFiatRamp = () => {
    if (!user.address) {
      alert('Моля, свържете първо портфейла си');
      return;
    }
    setShowWidget(true);
    // Start monitoring for new USDC to auto-convert
    void startMonitoring();
  };

  const getKadoUrl = () => {
    if (!user.address) return '';

    // Kado Money - pre-configured for USDC on Arbitrum with locked selections
    const kadoParams = new URLSearchParams({
      onToAddress: user.address,
      onCurrency: 'USDC',
      onNetwork: 'ARBITRUM',
      offCurrency: 'EUR',
      offAmount: '50',
      mode: 'minimal',
      theme: 'light',
      lockCurrency: 'true',
      lockNetwork: 'true',
      hideOtherCurrencies: 'true',
    });

    return `https://app.kado.money?${kadoParams.toString()}`;
  };

  // Check USDC balance on wallet connection
  useEffect(() => {
    const checkUSDCBalance = async () => {
      if (user.address) {
        setCheckingBalance(true);
        try {
          const balance = await getUSDCBalance(user.address);
          setUsdcBalance(balance);
        } catch (error) {
          console.error('Error checking USDC balance:', error);
        } finally {
          setCheckingBalance(false);
        }
      } else {
        setUsdcBalance('0');
        setCheckingBalance(false);
      }
    };

    void checkUSDCBalance();
  }, [user.address, getUSDCBalance]);

  useEffect(() => {
    // Clean up monitoring when component unmounts
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const handleStep1USDCToEURe = async () => {
    try {
      await swapUSDCToEURe(usdcBalance);
      // Refresh balance after conversion
      const newBalance = await getUSDCBalance(user.address!);
      setUsdcBalance(newBalance);
      alert(
        '✅ Стъпка 1 завършена! USDC конвертиран в EURe. Сега натиснете Стъпка 2.'
      );
    } catch (error) {
      console.error('Step 1 failed:', error);
      alert('Стъпка 1 неуспешна. Моля опитайте отново.');
    }
  };

  const handleStep2EUReToNBGN = async () => {
    try {
      // Get EURe balance first
      const eureBalance = await getEUReBalance(user.address!);
      if (parseFloat(eureBalance) < 0.01) {
        alert('Няма достатъчно EURe. Моля първо изпълнете Стъпка 1.');
        return;
      }

      await mintNBGNFromEURe(eureBalance);
      // Refresh balance after conversion
      const newBalance = await getUSDCBalance(user.address!);
      setUsdcBalance(newBalance);
      alert('🎉 Готово! EURe конвертиран в NBGN токени!');
    } catch (error) {
      console.error('Step 2 failed:', error);
      alert(
        'Стъпка 2 неуспешна. Моля опитайте отново или използвайте Exchange секцията.'
      );
    }
  };

  const hasUSDC = parseFloat(usdcBalance) > 0.01; // More than 1 cent

  return (
    <div className="ramp-page">
      {/* Warning Banner */}
      <div className="ramp-warning-banner">
        <div className="ramp-warning-content">
          <i className="fas fa-exclamation-triangle"></i>
          <div className="ramp-warning-text">
            <strong>ВНИМАНИЕ:</strong> Фиат покупките са в експериментален
            режим. Използвайте само малки суми за тестване. Не сме отговорни за
            загуби.
          </div>
        </div>
      </div>

      {/* Simple Header */}
      <div className="ramp-header">
        <div className="ramp-header-content">
          <div>
            <h1>
              <i className="fas fa-credit-card"></i>
              Купи NBGN
            </h1>
            <p className="ramp-header-subtitle">
              Директно с дебитна/кредитна карта
            </p>
          </div>
          <a href="/" className="ramp-back-link">
            <i className="fas fa-arrow-left mr-2"></i>
            Назад
          </a>
        </div>
      </div>

      <div className="ramp-container">
        {/* Wallet Connection */}
        {!user.address && (
          <div className="ramp-wallet-card">
            <div className="ramp-wallet-icon">
              <i className="fas fa-wallet"></i>
            </div>
            <h2>Свържете портфейла си</h2>
            <p>
              Необходимо е да свържете портфейла си за да купите NBGN токени
            </p>
            <WalletConnect />
          </div>
        )}

        {user.address && (
          <>
            {/* Chain Warning */}
            <div style={{ marginBottom: '24px' }}>
              <ChainWarning
                currentChainId={chainId}
                onSwitchChain={switchToArbitrum}
              />
            </div>

            {/* Main Purchase Card */}
            <div className="ramp-main-card">
              {!showWidget ? (
                <div className="ramp-card-content">
                  {checkingBalance ? (
                    <div className="ramp-checking-balance">
                      <div className="ramp-spinner"></div>
                      <h2>Проверяваме USDC баланса...</h2>
                    </div>
                  ) : hasUSDC ? (
                    <>
                      {/* User has USDC - show continue conversion */}
                      <div
                        className="ramp-coin-icon"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        <i className="fas fa-check-circle"></i>
                      </div>

                      <h2>USDC намерен!</h2>

                      <p>
                        Намерихме {parseFloat(usdcBalance).toFixed(2)} USDC в
                        портфейла ви. Продължете с автоматичната конвертация в
                        NBGN токени.
                      </p>

                      <div className="ramp-balance-display">
                        <div className="ramp-balance-item">
                          <span className="ramp-balance-label">
                            Налични USDC:
                          </span>
                          <span className="ramp-balance-value">
                            {parseFloat(usdcBalance).toFixed(2)} USDC
                          </span>
                        </div>
                      </div>

                      <div className="ramp-two-step-buttons">
                        <button
                          onClick={handleStep1USDCToEURe}
                          className="ramp-step-button"
                          disabled={swapLoading}
                        >
                          {swapLoading ? (
                            <>
                              <div className="ramp-button-spinner"></div>
                              Стъпка 1...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-exchange-alt"></i>
                              Стъпка 1: USDC → EURe
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleStep2EUReToNBGN}
                          className="ramp-step-button"
                          disabled={swapLoading}
                        >
                          {swapLoading ? (
                            <>
                              <div className="ramp-button-spinner"></div>
                              Стъпка 2...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-coins"></i>
                              Стъпка 2: EURe → NBGN
                            </>
                          )}
                        </button>
                      </div>

                      <div
                        className="ramp-liquidity-note"
                        style={{
                          marginTop: '20px',
                          padding: '15px',
                          backgroundColor: '#e3f2fd',
                          borderRadius: '8px',
                          border: '1px solid #90caf9',
                          fontSize: '14px',
                        }}
                      >
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                          💡 Алтернативен начин
                        </h4>
                        <p style={{ margin: '0', fontSize: '14px' }}>
                          Ако имате проблеми с USDC → EURe конверсията, можете
                          да купите EURe директно от{' '}
                          <a
                            href="https://monerium.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff' }}
                          >
                            Monerium
                          </a>{' '}
                          и след това да използвате <strong>Exchange</strong>{' '}
                          секцията на този сайт за да конвертирате EURe → NBGN.
                        </p>
                      </div>

                      <div className="ramp-conversion-note">
                        <i className="fas fa-info-circle"></i>
                        Процес в 2 стъпки: USDC → EURe → NBGN
                      </div>
                    </>
                  ) : (
                    <>
                      {/* No USDC - show normal flow */}
                      <div className="ramp-coin-icon">
                        <i className="fas fa-coins"></i>
                      </div>

                      <h2>Купете NBGN токени</h2>

                      <p>
                        Купете NBGN токени директно с дебитна или кредитна
                        карта. Процесът е бърз, сигурен и автоматичен.
                      </p>

                      <div className="ramp-waiting-note">
                        <i className="fas fa-info-circle"></i>
                        <p>
                          <strong>
                            Ако сте заявили USDC в последните 15 минути:
                          </strong>{' '}
                          Изчакайте малко повече време.
                          <br />
                          <strong>Ако е минал час:</strong> Транзакцията
                          вероятно е отхвърлена от банката ви - опитайте отново.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Auto-conversion status */}
                  {isMonitoring && (
                    <div className="ramp-status-box">
                      <div className="ramp-spinner"></div>
                      <span className="ramp-status-text">
                        {swapStatus === 'detecting' &&
                          'Следим за покупка на USDC...'}
                        {swapStatus === 'swapping' &&
                          'Конвертираме USDC в NBGN...'}
                        {swapStatus === 'completed' &&
                          'Готово! NBGN токените са в портфейла ви'}
                        {swapStatus === 'error' &&
                          'Грешка при конвертация - опитайте ръчно'}
                      </span>
                    </div>
                  )}

                  {/* Show automatic process only if no USDC */}
                  {!hasUSDC && !checkingBalance && (
                    <>
                      {/* Maximally Automatic Process */}
                      <div className="ramp-automatic-process">
                        <h3>
                          <i className="fas fa-magic"></i>
                          Напълно автоматичен процес!
                        </h3>
                        <div className="ramp-automatic-box">
                          <div className="ramp-automatic-item">
                            <div className="ramp-automatic-icon">💳</div>
                            <div className="ramp-automatic-text">
                              <strong>
                                Само въведете данните на картата си
                              </strong>
                              <p>Всичко останало се случва автоматично</p>
                            </div>
                          </div>
                          <div className="ramp-automatic-arrow">→</div>
                          <div className="ramp-automatic-item">
                            <div className="ramp-automatic-icon">🔄</div>
                            <div className="ramp-automatic-text">
                              <strong>Автоматична конвертация</strong>
                              <p>EUR → USDC → EURe → NBGN</p>
                            </div>
                          </div>
                          <div className="ramp-automatic-arrow">→</div>
                          <div className="ramp-automatic-item">
                            <div className="ramp-automatic-icon">🎉</div>
                            <div className="ramp-automatic-text">
                              <strong>NBGN в портфейла ви!</strong>
                              <p>Готово за 10-15 минути</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={openFiatRamp}
                        className="ramp-buy-button"
                      >
                        <i className="fas fa-credit-card"></i>
                        Купи NBGN с карта
                      </button>

                      <p className="ramp-supported-text">
                        Поддържани са карти от България и ЕС
                      </p>
                    </>
                  )}

                  {/* Resume monitoring button for users who already used fiat ramp */}
                  {hasUSDC && (
                    <div className="ramp-resume-section">
                      <p className="ramp-resume-text">
                        <i className="fas fa-lightbulb"></i>
                        Или купете още USDC за повече NBGN токени:
                      </p>
                      <button
                        onClick={() => {
                          setShowWidget(true);
                          void startMonitoring();
                        }}
                        className="ramp-resume-button"
                        disabled={isMonitoring}
                      >
                        <i className="fas fa-plus"></i>
                        {isMonitoring
                          ? 'Мониторингът е активен'
                          : 'Купи още USDC'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="ramp-widget-header">
                    <h3>Купете NBGN токени - Kado</h3>
                    <button
                      onClick={() => setShowWidget(false)}
                      className="ramp-close-button"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="ramp-widget-container">
                    <iframe
                      src={getKadoUrl()}
                      className="ramp-widget-iframe"
                      frameBorder="0"
                      allow="payment; usb; ethereum; web3"
                      title="Купете NBGN токени"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                    />
                  </div>

                  <div className="ramp-widget-help">
                    <p>
                      <i className="fas fa-clock"></i>
                      Поръчката обикновено отнема 10-15 минути за обработка.
                      След получаване на USDC, може да ги конвертирате в NBGN на
                      тази страница.
                    </p>
                    <Link to="/" className="ramp-home-button">
                      <i className="fas fa-home"></i>
                      Обратно към началото
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="ramp-info-box">
              <i className="fas fa-shield-alt"></i>
              <div className="ramp-info-content">
                <h3>Сигурна и надеждна покупка</h3>
                <p>
                  Използваме водещи платформи за сигурни криптовалутни покупки.
                  Вашите данни са защитени и транзакциите са шифровани.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
