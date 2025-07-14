import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../contexts/AppContext';
import { useRampSwap } from '../../../hooks/useRampSwap';

export const USDCSwap: React.FC = () => {
  const { user } = useAppState();
  const {
    loading,
    error,
    getUSDCBalance,
    getEUReBalance,
    swapUSDCToNBGN,
    calculateExpectedNBGN,
  } = useRampSwap();

  const [usdcAmount, setUsdcAmount] = useState('');
  const [expectedNBGN, setExpectedNBGN] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [eureBalance, setEureBalance] = useState('0');
  const [slippage, setSlippage] = useState(1);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Load balances
  useEffect(() => {
    if (user.address) {
      loadBalances();
    }
  }, [user.address]);

  // Calculate expected NBGN when amount changes
  useEffect(() => {
    if (usdcAmount && parseFloat(usdcAmount) > 0) {
      calculateExpectedNBGN(usdcAmount).then(setExpectedNBGN);
    } else {
      setExpectedNBGN('0');
    }
  }, [usdcAmount, calculateExpectedNBGN]);

  const loadBalances = async () => {
    if (!user.address) return;
    
    try {
      const [usdc, eure] = await Promise.all([
        getUSDCBalance(user.address),
        getEUReBalance(user.address),
      ]);
      setUsdcBalance(usdc);
      setEureBalance(eure);
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  const handleSwap = async () => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
      alert('Please enter a valid USDC amount');
      return;
    }

    if (parseFloat(usdcAmount) > parseFloat(usdcBalance)) {
      alert('Insufficient USDC balance');
      return;
    }

    try {
      const result = await swapUSDCToNBGN(usdcAmount, slippage);
      setTxHash(result.mintHash); // Show the NBGN mint transaction
      setUsdcAmount('');
      await loadBalances(); // Refresh balances
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  const setMaxAmount = () => {
    setUsdcAmount(usdcBalance);
  };

  if (!user.address) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please connect your wallet to use the swap feature.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Balances */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Your Balances</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">USDC:</span>
            <span className="font-mono">{parseFloat(usdcBalance).toFixed(6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">EURe:</span>
            <span className="font-mono">{parseFloat(eureBalance).toFixed(6)}</span>
          </div>
        </div>
      </div>

      {/* Swap Form */}
      <div className="space-y-4">
        {/* From (USDC) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From (USDC)
          </label>
          <div className="relative">
            <input
              type="number"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              min="0"
              max={usdcBalance}
              className="w-full px-3 py-3 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Balance: {parseFloat(usdcBalance).toFixed(6)} USDC
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="bg-blue-100 p-2 rounded-full">
            <i className="fas fa-arrow-down text-blue-600"></i>
          </div>
        </div>

        {/* To (NBGN) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To (NBGN)
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
            <div className="text-lg font-mono text-gray-900">
              {parseFloat(expectedNBGN).toFixed(6)}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Rate: 1 USDC ≈ {expectedNBGN && usdcAmount ? (parseFloat(expectedNBGN) / parseFloat(usdcAmount || '1')).toFixed(4) : '0'} NBGN
          </p>
        </div>

        {/* Slippage Settings */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-800">Slippage Tolerance</span>
            <span className="text-sm text-yellow-700">{slippage}%</span>
          </div>
          <div className="flex gap-2">
            {[0.5, 1, 2, 5].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-3 py-1 text-xs rounded ${
                  slippage === value
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Swap Process Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            <i className="fas fa-info-circle mr-1"></i>
            Swap Process
          </h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div>1. USDC → EURe (via Uniswap V3)</div>
            <div>2. EURe → NBGN (via NBGN contract)</div>
            <div className="font-semibold">Rate: 1 EUR = 1.95583 NBGN</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </p>
          </div>
        )}

        {/* Success Display */}
        {txHash && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 mb-2">
              <i className="fas fa-check-circle mr-2"></i>
              Swap completed successfully!
            </p>
            <a
              href={`https://arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              View on Arbiscan →
            </a>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={
            loading ||
            !usdcAmount ||
            parseFloat(usdcAmount) <= 0 ||
            parseFloat(usdcAmount) > parseFloat(usdcBalance)
          }
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Swapping...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <i className="fas fa-exchange-alt mr-2"></i>
              Swap USDC to NBGN
            </span>
          )}
        </button>
      </div>
    </div>
  );
};