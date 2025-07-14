import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useAppState } from '../../../contexts/AppContext';
import { useNBGN } from '../../../hooks/useNBGN';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';
import { EURE_ABI } from '../../../contracts/abis/EURe';
import environment from '../../../config/environment';
import { useNBGNFormatter } from '../../../utils/formatters';

export const NBGNExchange: React.FC = () => {
  const { t } = useTranslation();
  const { web3, user } = useAppState();
  const { getContract, refresh: refreshNBGN } = useNBGN();
  const { executeTransaction, status, hash, error } = useTransaction();
  const formatNBGN = useNBGNFormatter();
  
  const [eureAmount, setEureAmount] = useState('');
  const [eureBalance, setEureBalance] = useState('0');
  const [expectedNBGN, setExpectedNBGN] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Format EURe with 2 decimals
  const formatEURe = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0,00';
    
    return numValue.toLocaleString('bg-BG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get EURe contract
  const getEUReContract = async () => {
    if (!web3.provider || !environment.eureAddress) return null;
    
    try {
      const signer = await web3.provider.getSigner();
      return new ethers.Contract(environment.eureAddress, EURE_ABI, signer);
    } catch (error) {
      console.error('Failed to get EURe contract:', error);
      return null;
    }
  };

  // Fetch EURe balance and allowance
  useEffect(() => {
    const fetchEUReData = async () => {
      if (!user.address || !web3.provider) return;
      
      try {
        setLoading(true);
        const eureContract = await getEUReContract();
        const nbgnContract = await getContract();
        
        if (!eureContract || !nbgnContract) return;
        
        // Get EURe balance
        const balance = await eureContract.balanceOf(user.address);
        const formattedBalance = ethers.formatUnits(balance, 18); // EURe has 18 decimals
        setEureBalance(formattedBalance);
        
        // Get current allowance
        const currentAllowance = await eureContract.allowance(user.address, environment.contractAddress);
        setAllowance(ethers.formatUnits(currentAllowance, 18));
      } catch (error) {
        console.error('Failed to fetch EURe data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEUReData();
  }, [user.address, web3.provider]);

  // Calculate expected NBGN when amount changes
  useEffect(() => {
    const calculateExpected = async () => {
      if (!eureAmount || parseFloat(eureAmount) <= 0) {
        setExpectedNBGN('0');
        return;
      }
      
      try {
        console.log('Calculating expected NBGN for amount:', eureAmount);
        const nbgnContract = await getContract();
        if (!nbgnContract) {
          console.error('No NBGN contract available');
          return;
        }
        
        console.log('Contract address:', environment.contractAddress);
        const eureAmountWei = ethers.parseUnits(eureAmount, 18);
        console.log('EURe amount in wei:', eureAmountWei.toString());
        
        const expected = await nbgnContract.calculateNBGN(eureAmountWei);
        console.log('Expected NBGN from contract:', expected.toString());
        
        const formattedExpected = ethers.formatUnits(expected, 18);
        console.log('Formatted expected NBGN:', formattedExpected);
        
        setExpectedNBGN(formattedExpected);
      } catch (error) {
        console.error('Failed to calculate expected NBGN:', error);
        
        // Fallback calculation: 1 EUR = 1.95583 NBGN (fixed rate)
        const fallbackNBGN = (parseFloat(eureAmount) * 1.95583).toString();
        console.log('Using fallback calculation:', fallbackNBGN);
        setExpectedNBGN(fallbackNBGN);
      }
    };

    calculateExpected();
  }, [eureAmount, getContract]);

  const handleApprove = async () => {
    if (!eureAmount || parseFloat(eureAmount) <= 0) return;
    
    setIsApproving(true);
    
    try {
      await executeTransaction(async () => {
        const eureContract = await getEUReContract();
        if (!eureContract) throw new Error('EURe contract not available');
        
        const amountWei = ethers.parseUnits(eureAmount, 18);
        return await eureContract.approve(environment.contractAddress, amountWei);
      });
      
      // Refresh allowance after approval
      const eureContract = await getEUReContract();
      if (eureContract) {
        const newAllowance = await eureContract.allowance(user.address, environment.contractAddress);
        setAllowance(ethers.formatUnits(newAllowance, 18));
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleMint = async () => {
    if (!eureAmount || parseFloat(eureAmount) <= 0) return;
    
    setIsMinting(true);
    
    try {
      await executeTransaction(async () => {
        const nbgnContract = await getContract();
        if (!nbgnContract) throw new Error('NBGN contract not available');
        
        const amountWei = ethers.parseUnits(eureAmount, 18);
        return await nbgnContract.mint(amountWei);
      });
      
      // Clear form and refresh balances on success
      setEureAmount('');
      setExpectedNBGN('0');
      
      // Refresh balances
      await refreshNBGN();
      
      // Refresh EURe balance
      const eureContract = await getEUReContract();
      if (eureContract) {
        const balance = await eureContract.balanceOf(user.address);
        setEureBalance(ethers.formatUnits(balance, 18));
      }
    } catch (err) {
      console.error('Minting failed:', err);
    } finally {
      setIsMinting(false);
    }
  };

  const handleApproveAndMint = async () => {
    if (!eureAmount || parseFloat(eureAmount) <= 0) return;
    
    setIsMinting(true);
    setIsApproving(true);
    
    try {
      // Step 1: Approve EURe
      await executeTransaction(async () => {
        const eureContract = await getEUReContract();
        if (!eureContract) throw new Error('EURe contract not available');
        
        const amountWei = ethers.parseUnits(eureAmount, 18);
        return await eureContract.approve(environment.contractAddress, amountWei);
      });
      
      // Wait a moment for approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Mint NBGN
      await executeTransaction(async () => {
        const nbgnContract = await getContract();
        if (!nbgnContract) throw new Error('NBGN contract not available');
        
        const amountWei = ethers.parseUnits(eureAmount, 18);
        return await nbgnContract.mint(amountWei);
      });
      
      // Clear form and refresh balances on success
      setEureAmount('');
      setExpectedNBGN('0');
      
      // Refresh balances
      await refreshNBGN();
      
      // Refresh EURe balance and allowance
      const eureContract = await getEUReContract();
      if (eureContract) {
        const balance = await eureContract.balanceOf(user.address);
        setEureBalance(ethers.formatUnits(balance, 18));
        
        const newAllowance = await eureContract.allowance(user.address, environment.contractAddress);
        setAllowance(ethers.formatUnits(newAllowance, 18));
      }
    } catch (err) {
      console.error('Approve and mint failed:', err);
    } finally {
      setIsMinting(false);
      setIsApproving(false);
    }
  };

  const needsApproval = parseFloat(allowance) < parseFloat(eureAmount || '0');

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          <i className="fas fa-exchange-alt mr-2 text-green-600"></i>
          {t('web3:exchange.title', 'Buy NBGN with EURe')}
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
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <i className="fas fa-exchange-alt text-blue-600"></i>
        </div>
        {t('web3:exchange.title', 'Buy NBGN with EURe')}
      </h3>

      {/* EURe Balance Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">{t('web3:exchange.eureBalance', 'EURe Balance')}</span>
          <span className="text-xl font-bold text-blue-800"> - {formatEURe(eureBalance)} €</span>
        </div>
      </div>

      {/* Exchange Form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <i className="fas fa-coins mr-2 text-blue-600"></i>
            {t('web3:exchange.eureAmount', 'EURe Amount')}
          </label>
          <input
            type="number"
            step="0.01"
            value={eureAmount}
            onChange={(e) => setEureAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-lg font-medium transition-all"
          />
          <button
            type="button"
            onClick={() => setEureAmount(eureBalance)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('web3:exchange.useMax', 'Use max')}
          </button>
        </div>

        {/* Conversion Arrow & Preview */}
        {eureAmount && parseFloat(eureAmount) > 0 && (
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-down text-green-600"></i>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">{t('web3:exchange.willReceive', 'You will receive')}</p>
                  <p className="text-2xl font-bold text-green-800"> - {formatNBGN(expectedNBGN)}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-xs">NBGN</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={needsApproval ? handleApproveAndMint : handleMint}
            disabled={(isApproving || isMinting) || !eureAmount || parseFloat(eureAmount) <= 0 || parseFloat(eureAmount) > parseFloat(eureBalance)}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {(isApproving || isMinting) ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {isApproving && !isMinting ? 
                  t('web3:exchange.approving', 'Approving EURe...') : 
                  t('web3:exchange.minting', 'Buying NBGN...')
                }
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <i className="fas fa-coins mr-3"></i>
                {needsApproval ? 
                  t('web3:exchange.approveAndMint', 'Approve & Buy NBGN') : 
                  t('web3:exchange.mint', 'Buy NBGN')
                }
              </span>
            )}
          </button>
          
          {/* Insufficient Balance Warning */}
          {eureAmount && parseFloat(eureAmount) > parseFloat(eureBalance) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm text-center font-medium">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {t('web3:exchange.insufficientBalance', 'Insufficient EURe balance')}
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