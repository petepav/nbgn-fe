import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../contexts/AppContext';
import { useWeb3 } from '../hooks/useWeb3';
import { WalletConnect } from './Web3/WalletConnect';
import { ChainWarning } from './Web3/ChainWarning';
import { USDCSwap } from './Web3/USDCSwap';

export const RampPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { chainId, switchToArbitrum } = useWeb3();
  const [activeTab, setActiveTab] = useState<'buy' | 'swap'>('buy');

  const openTransak = () => {
    if (!user.address) {
      alert('Please connect your wallet first');
      return;
    }

    const transakUrl = `https://global.transak.com/?` + 
      `apiKey=${process.env.REACT_APP_TRANSAK_API_KEY || 'YOUR_API_KEY'}&` +
      `network=arbitrum&` +
      `cryptoCurrencyCode=USDC&` +
      `defaultCryptoAmount=20&` +
      `walletAddress=${user.address}&` +
      `hideMenu=true&` +
      `themeColor=00966F`;
    
    window.open(transakUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <i className="fas fa-exchange-alt mr-3 text-green-600"></i>
                NBGN Ramp
              </h1>
              <p className="text-gray-600 mt-2">
                Buy USDC with fiat or swap existing USDC to NBGN
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to App
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnect />
        </div>

        {user.address && (
          <>
            {/* Chain Warning */}
            <div className="mb-8">
              <ChainWarning currentChainId={chainId} onSwitchChain={switchToArbitrum} />
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('buy')}
                  className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                    activeTab === 'buy'
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Buy USDC with Fiat
                </button>
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
                    activeTab === 'swap'
                      ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Swap USDC to NBGN
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'buy' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Buy USDC with Credit Card
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Purchase USDC directly to your Arbitrum wallet using fiat currency
                      </p>
                    </div>

                    {/* Step-by-step guide */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">
                        <i className="fas fa-route mr-2"></i>
                        How it works
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                          <span className="text-blue-800">Buy USDC with your credit card via Transak</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                          <span className="text-blue-800">USDC arrives in your connected wallet on Arbitrum</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                          <span className="text-blue-800">Switch to "Swap" tab to convert USDC → NBGN</span>
                        </div>
                      </div>
                    </div>

                    {/* Transak Button */}
                    <div className="text-center">
                      <button
                        onClick={openTransak}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <i className="fas fa-credit-card mr-3"></i>
                        Buy USDC with Transak
                      </button>
                      <p className="text-sm text-gray-500 mt-4">
                        Powered by Transak • KYC required for larger amounts
                      </p>
                    </div>

                    {/* Alternative Methods */}
                    <div className="border-t border-gray-200 pt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Alternative Methods
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            <i className="fas fa-building mr-2 text-gray-600"></i>
                            CEX Transfer
                          </h4>
                          <p className="text-sm text-gray-600">
                            Buy USDC on Coinbase, Binance, etc. and withdraw to Arbitrum
                          </p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            <i className="fas fa-bridge mr-2 text-gray-600"></i>
                            Bridge from L1
                          </h4>
                          <p className="text-sm text-gray-600">
                            Bridge USDC from Ethereum mainnet using Arbitrum bridge
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'swap' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Convert USDC to NBGN
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Swap your USDC for NBGN tokens via EURe at the official rate
                      </p>
                    </div>

                    <USDCSwap />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};