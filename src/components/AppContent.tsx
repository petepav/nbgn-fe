import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WalletConnect } from './Web3/WalletConnect';
import { NBGNTransfer } from './Web3/NBGNTransfer';
import { NBGNExchange } from './Web3/NBGNExchange';
import { NBGNRedeem } from './Web3/NBGNRedeem';
import { TransactionHistory } from './Web3/TransactionHistory';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAppState } from '../contexts/AppContext';

export const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const [activeWidget, setActiveWidget] = useState<
    'send' | 'history' | 'exchange' | 'redeem'
  >('send');

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-controls">
          <LanguageSwitcher />
        </div>
        <h1>{t('common:welcome')}</h1>
        <WalletConnect />

        {user.address && (
          <div className="mt-8 w-full max-w-2xl">
            {/* Widget Toggle Buttons */}
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              <button
                onClick={() => setActiveWidget('send')}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  activeWidget === 'send'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:text-green-600'
                }`}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                {t('web3:transaction.send', 'Send')}
              </button>

              <button
                onClick={() => setActiveWidget('exchange')}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  activeWidget === 'exchange'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <i className="fas fa-coins mr-2"></i>
                {t('web3:exchange.shortTitle', 'Buy')}
              </button>

              <button
                onClick={() => setActiveWidget('redeem')}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  activeWidget === 'redeem'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:text-red-600'
                }`}
              >
                <i className="fas fa-fire mr-2"></i>
                {t('web3:redeem.shortTitle', 'Sell')}
              </button>

              <button
                onClick={() => setActiveWidget('history')}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  activeWidget === 'history'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                }`}
              >
                <i className="fas fa-clock-rotate-left mr-2"></i>
                {t('web3:transaction.historyShort', 'History')}
              </button>
            </div>

            {/* Widget Content */}
            {activeWidget === 'send' && <NBGNTransfer />}
            {activeWidget === 'exchange' && <NBGNExchange />}
            {activeWidget === 'redeem' && <NBGNRedeem />}
            {activeWidget === 'history' && <TransactionHistory />}
          </div>
        )}
      </header>

      <footer className="disclaimer-footer">
        <div className="disclaimer-content">
          <h3>🛡️ Правен отказ от отговорност (Disclaimer)</h3>
          <p>
            NBGN е частен криптографски проект, създаден с образователна и/или
            експериментална цел. Този проект не е официална валута, не е
            подкрепен от Българската народна банка (БНБ), не е свързан с
            българската държава и не претендира за държавна гаранция.
          </p>
          <p>
            Участието в проекта се извършва изцяло доброволно и на собствен
            риск. NBGN не представлява законно платежно средство в България или
            в която и да е друга държава.
          </p>
          <p>
            Настоящата инициатива не предлага инвестиционни продукти, финансови
            услуги или събиране на средства с цел печалба. Проектът не извършва
            дейности, подлежащи на лицензиране от Комисията за финансов надзор
            (КФН), БНБ или други регулаторни органи.
          </p>
          <p>
            Всички имена, термини и символи, използвани в този проект, са
            художествени и имат изцяло символичен характер. Всяко съвпадение с
            реални институции, валути или регулаторни термини е случайно или
            използвано с ясна дистинкция и без намерение за подвеждане.
          </p>
        </div>
      </footer>
    </div>
  );
};
