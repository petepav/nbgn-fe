import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTokenContext } from '../../../contexts/TokenContext';
import { TokenExchange } from '../TokenExchange';
import { TokenRedeem } from '../TokenRedeem';
import './TokenTrade.css';

export const TokenTrade: React.FC = () => {
  const { t } = useTranslation();
  const { selectedToken } = useTokenContext();
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');

  return (
    <div className="token-trade-container">
      <h3 className="text-xl font-bold mb-4">
        {t('web3:trade.title', 'Trade')} {selectedToken}
      </h3>

      {/* Trade Mode Toggle */}
      <div className="trade-mode-toggle">
        <button
          className={`trade-mode-button ${tradeMode === 'buy' ? 'active' : ''}`}
          onClick={() => setTradeMode('buy')}
        >
          <i className="fas fa-coins"></i>
          <span>
            {t('web3:exchange.shortTitle', 'Buy')} {selectedToken}
          </span>
        </button>

        <button
          className={`trade-mode-button ${tradeMode === 'sell' ? 'active' : ''}`}
          onClick={() => setTradeMode('sell')}
        >
          <i className="fas fa-money-bill-wave"></i>
          <span>
            {t('web3:redeem.shortTitle', 'Sell')} {selectedToken}
          </span>
        </button>
      </div>

      {/* Trade Content */}
      <div className="trade-content">
        {tradeMode === 'buy' ? <TokenExchange /> : <TokenRedeem />}
      </div>
    </div>
  );
};
