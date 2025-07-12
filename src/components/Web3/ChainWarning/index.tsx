import React from 'react';
import { useTranslation } from 'react-i18next';

interface ChainWarningProps {
  currentChainId: number | undefined;
  onSwitchChain?: () => void;
}

export const ChainWarning: React.FC<ChainWarningProps> = ({ currentChainId, onSwitchChain }) => {
  const { t } = useTranslation();
  
  // Arbitrum One chain ID
  const ARBITRUM_CHAIN_ID = 42161;
  
  if (!currentChainId || currentChainId === ARBITRUM_CHAIN_ID) {
    return null;
  }
  
  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 56: return 'BNB Chain';
      case 137: return 'Polygon';
      case 10: return 'Optimism';
      case 43114: return 'Avalanche';
      case 250: return 'Fantom';
      case 8453: return 'Base';
      default: return `Chain ID: ${chainId}`;
    }
  };
  
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-exclamation-triangle text-red-600 text-lg"></i>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-800 mb-2">
            {t('web3:chainWarning.title', 'Wrong Network!')}
          </h3>
          <p className="text-red-700 mb-3">
            {t('web3:chainWarning.message', 
              'You are connected to {{currentChain}}. Please switch to Arbitrum One or you may lose your funds!',
              { currentChain: getChainName(currentChainId) }
            )}
          </p>
          <p className="text-sm text-red-600 mb-4">
            {t('web3:chainWarning.warning', 
              '⚠️ Transactions on the wrong network will fail and fees may be lost.'
            )}
          </p>
          {onSwitchChain && (
            <button
              onClick={onSwitchChain}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-md"
            >
              <i className="fas fa-network-wired mr-2"></i>
              {t('web3:chainWarning.switchButton', 'Switch to Arbitrum One')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};