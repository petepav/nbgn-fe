import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TokenExchange } from '../TokenExchange';
import { TokenRedeem } from '../TokenRedeem';
import './TokenTrade.css';

export const TokenTrade: React.FC = () => {
  const { t } = useTranslation();
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');

  return (
    <div className="token-trade-container">
      {/* Trade Mode Toggle */}
      <div className="trade-mode-toggle">
        <button
          className={`trade-mode-button ${tradeMode === 'buy' ? 'active buy' : ''}`}
          onClick={() => setTradeMode('buy')}
        >
          <i className="fas fa-shopping-cart mr-2"></i>
          {t('web3:exchange.shortTitle', 'Buy')}
        </button>

        <div className="trade-mode-divider">
          <i className="fas fa-exchange-alt"></i>
        </div>

        <button
          className={`trade-mode-button ${tradeMode === 'sell' ? 'active sell' : ''}`}
          onClick={() => setTradeMode('sell')}
        >
          <i className="fas fa-hand-holding-usd mr-2"></i>
          {t('web3:redeem.shortTitle', 'Sell')}
        </button>
      </div>

      {/* Trade Content */}
      <div className="trade-content">
        {tradeMode === 'buy' ? <TokenExchange /> : <TokenRedeem />}
      </div>
    </div>
  );
};
