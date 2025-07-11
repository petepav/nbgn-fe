import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useAppState } from '../../../contexts/AppContext';
import { useNBGN } from '../../../hooks/useNBGN';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';
import { EURC_ABI } from '../../../contracts/abis/EURC';
import environment from '../../../config/environment';
import { useNBGNFormatter } from '../../../utils/formatters';

export const NBGNRedeem: React.FC = () => {
  const { t } = useTranslation();
  const { web3, user } = useAppState();
  const { getContract, refresh: refreshNBGN, rawBalance: nbgnBalance, formattedBalance } = useNBGN();
  const { executeTransaction, status, hash, error } = useTransaction();
  const formatNBGN = useNBGNFormatter();
  
  const [nbgnAmount, setNbgnAmount] = useState('');
  const [eurcBalance, setEurcBalance] = useState('0');
  const [expectedEURC, setExpectedEURC] = useState('0');
  const [loading, setLoading] = useState(true);
  const [isBurning, setIsBurning] = useState(false);

  // Format EURC with 2 decimals
  const formatEURC = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0,00';
    
    return numValue.toLocaleString('bg-BG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get EURC contract
  const getEURCContract = async () => {
    if (!web3.provider || !environment.eurcAddress) return null;
    
    try {
      const signer = await web3.provider.getSigner();
      return new ethers.Contract(environment.eurcAddress, EURC_ABI, signer);
    } catch (error) {
      console.error('Failed to get EURC contract:', error);
      return null;
    }
  };

  // Fetch EURC balance
  useEffect(() => {
    const fetchEURCBalance = async () => {
      if (!user.address || !web3.provider) return;
      
      try {
        setLoading(true);
        const eurcContract = await getEURCContract();
        
        if (!eurcContract) return;
        
        // Get EURC balance
        const balance = await eurcContract.balanceOf(user.address);
        const formattedBalance = ethers.formatUnits(balance, 6); // EURC has 6 decimals
        setEurcBalance(formattedBalance);
      } catch (error) {
        console.error('Failed to fetch EURC balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEURCBalance();
  }, [user.address, web3.provider]);

  // Calculate expected EURC when amount changes
  useEffect(() => {
    const calculateExpected = async () => {
      if (!nbgnAmount || parseFloat(nbgnAmount) <= 0) {
        setExpectedEURC('0');
        return;
      }
      
      try {
        const nbgnContract = await getContract();
        if (!nbgnContract) return;
        
        const nbgnAmountWei = ethers.parseEther(nbgnAmount);
        const expected = await nbgnContract.calculateEURC(nbgnAmountWei);
        setExpectedEURC(ethers.formatUnits(expected, 6)); // EURC has 6 decimals
      } catch (error) {
        console.error('Failed to calculate expected EURC:', error);
        setExpectedEURC('0');
      }
    };

    calculateExpected();
  }, [nbgnAmount, getContract]);

  const handleBurn = async () => {
    if (!nbgnAmount || parseFloat(nbgnAmount) <= 0) return;
    
    setIsBurning(true);
    
    try {
      await executeTransaction(async () => {
        const nbgnContract = await getContract();
        if (!nbgnContract) throw new Error('NBGN contract not available');
        
        const amountWei = ethers.parseEther(nbgnAmount);
        return await nbgnContract.redeem(amountWei);
      });
      
      // Clear form and refresh balances on success
      setNbgnAmount('');
      setExpectedEURC('0');
      
      // Refresh balances
      await refreshNBGN();
      
      // Refresh EURC balance
      const eurcContract = await getEURCContract();
      if (eurcContract) {
        const balance = await eurcContract.balanceOf(user.address);
        setEurcBalance(ethers.formatUnits(balance, 6));
      }
    } catch (err) {
      console.error('Burning failed:', err);
    } finally {
      setIsBurning(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          <i className="fas fa-fire mr-2 text-red-600"></i>
          {t('web3:redeem.title', 'Sell NBGN for EURC')}
        </h3>
        <div className="loader-container">
          <div className="red-loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
          <i className="fas fa-fire text-red-600"></i>
        </div>
        {t('web3:redeem.title', 'Sell NBGN for EURC')}
      </h3>

      {/* NBGN Balance Card */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">{t('web3:redeem.nbgnBalance', 'NBGN Balance')}</span>
          <span className="text-xl font-bold text-green-800"> - {formattedBalance}</span>
        </div>
      </div>

      {/* Redeem Form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-fire mr-2 text-red-600"></i>
            {t('web3:redeem.nbgnAmount', 'NBGN Amount to Sell')}
          </label>
          <input
            type="number"
            step="0.01"
            value={nbgnAmount}
            onChange={(e) => setNbgnAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-lg font-medium transition-all"
          />
          <button
            type="button"
            onClick={() => setNbgnAmount(nbgnBalance)}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {t('web3:redeem.useMax', 'Sell all')}
          </button>
        </div>

        {/* Conversion Arrow & Preview */}
        {nbgnAmount && parseFloat(nbgnAmount) > 0 && (
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-down text-blue-600"></i>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">{t('web3:redeem.willReceive', 'You will receive')}</p>
                  <p className="text-2xl font-bold text-blue-800"> - {formatEURC(expectedEURC)} €</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <i className="fas fa-euro-sign text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleBurn}
            disabled={isBurning || !nbgnAmount || parseFloat(nbgnAmount) <= 0 || parseFloat(nbgnAmount) > parseFloat(nbgnBalance)}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isBurning ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {t('web3:redeem.burning', 'Selling NBGN...')}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <i className="fas fa-fire mr-3"></i>
                {t('web3:redeem.burn', 'Sell NBGN')}
              </span>
            )}
          </button>
          
          {/* Insufficient Balance Warning */}
          {nbgnAmount && parseFloat(nbgnAmount) > parseFloat(nbgnBalance) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm text-center font-medium">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {t('web3:redeem.insufficientBalance', 'Insufficient NBGN balance')}
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Transaction Status */}
      {(status || error) && (
        <div className="mt-6">
          <TransactionStatus status={status} hash={hash} error={error} />
        </div>
      )}
    </div>
  );
};