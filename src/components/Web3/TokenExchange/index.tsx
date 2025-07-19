import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useAppState } from '../../../contexts/AppContext';
import { useToken } from '../../../hooks/useToken';
import { useTokenContext } from '../../../contexts/TokenContext';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';
import { EURE_ABI } from '../../../contracts/abis/EURe';
import { EURC_ABI } from '../../../contracts/abis/EURC';
import { getExchangeRate, calculateMintAmount } from '../../../config/tokens';

export const TokenExchange: React.FC = () => {
  const { t } = useTranslation();
  const { web3, user } = useAppState();
  const { selectedToken, getTokenConfig } = useTokenContext();
  const { getContract, refresh: refreshToken } = useToken();
  const { executeTransaction, status, hash, error } = useTransaction();

  const tokenConfig = getTokenConfig();
  const [stableAmount, setStableAmount] = useState('');
  const [stableBalance, setStableBalance] = useState('0');
  const [expectedTokenAmount, setExpectedTokenAmount] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Get the appropriate stable token ABI
  const getStableTokenABI = useCallback(() => {
    if (tokenConfig.stableTokenSymbol === 'EURe') return EURE_ABI;
    if (
      tokenConfig.stableTokenSymbol === 'EURC' ||
      tokenConfig.stableTokenSymbol === 'USDC'
    )
      return EURC_ABI;
    return EURE_ABI; // default
  }, [tokenConfig.stableTokenSymbol]);

  // Format stable token with appropriate decimals
  const formatStableToken = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';

    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get stable token contract
  const getStableTokenContract = useCallback(async () => {
    if (!web3.provider || !tokenConfig.stableTokenAddress) return null;

    try {
      const signer = await web3.provider.getSigner();
      return new ethers.Contract(
        tokenConfig.stableTokenAddress,
        getStableTokenABI(),
        signer
      );
    } catch (error) {
      console.error('Failed to get stable token contract:', error);
      return null;
    }
  }, [web3.provider, tokenConfig.stableTokenAddress, getStableTokenABI]);

  // Fetch stable token balance and allowance
  useEffect(() => {
    const fetchStableTokenData = async () => {
      if (!user.address || !web3.provider) return;

      try {
        setLoading(true);
        const stableContract = await getStableTokenContract();
        const tokenContract = await getContract();

        if (!stableContract || !tokenContract) return;

        // Get stable token balance
        const balance = await stableContract.balanceOf(user.address);
        const decimals = tokenConfig.stableTokenSymbol === 'USDC' ? 6 : 18;
        console.log('Raw balance from contract:', balance.toString());
        console.log('Decimals:', decimals);
        const formattedBalance = ethers.formatUnits(balance, decimals);
        console.log('Formatted balance:', formattedBalance);
        setStableBalance(formattedBalance);

        // Get current allowance
        const currentAllowance = await stableContract.allowance(
          user.address,
          tokenConfig.address
        );
        setAllowance(ethers.formatUnits(currentAllowance, decimals));
      } catch (error) {
        console.error('Failed to fetch stable token data:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStableTokenData();
  }, [
    user.address,
    web3.provider,
    selectedToken,
    getContract,
    getStableTokenContract,
    tokenConfig.address,
    tokenConfig.stableTokenSymbol,
  ]);

  // Calculate expected token amount when stable amount changes
  useEffect(() => {
    if (!stableAmount || isNaN(parseFloat(stableAmount))) {
      setExpectedTokenAmount('0');
      return;
    }

    const expected = calculateMintAmount(stableAmount, selectedToken);
    setExpectedTokenAmount(expected);
  }, [stableAmount, selectedToken]);

  const needsApproval = () => {
    if (!stableAmount) return false;
    return parseFloat(stableAmount) > parseFloat(allowance);
  };

  const handleApprove = async () => {
    if (!stableAmount) return;

    setIsApproving(true);

    try {
      await executeTransaction(async () => {
        const stableContract = await getStableTokenContract();
        if (!stableContract)
          throw new Error('Failed to get stable token contract');

        const decimals = tokenConfig.stableTokenSymbol === 'USDC' ? 6 : 18;
        const amountWei = ethers.parseUnits(stableAmount, decimals);

        return await stableContract.approve(tokenConfig.address, amountWei);
      });

      // Refresh allowance after approval
      const stableContract = await getStableTokenContract();
      if (stableContract) {
        const decimals = tokenConfig.stableTokenSymbol === 'USDC' ? 6 : 18;
        const newAllowance = await stableContract.allowance(
          user.address,
          tokenConfig.address
        );
        setAllowance(ethers.formatUnits(newAllowance, decimals));
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleMint = async () => {
    if (!stableAmount || needsApproval()) return;

    setIsMinting(true);

    try {
      await executeTransaction(async () => {
        const tokenContract = await getContract();
        if (!tokenContract) throw new Error('Failed to get token contract');

        const decimals = tokenConfig.stableTokenSymbol === 'USDC' ? 6 : 18;

        // For USDC, reduce amount by 0.1% to avoid any precision issues
        let adjustedAmount = stableAmount;
        if (tokenConfig.stableTokenSymbol === 'USDC') {
          const numAmount = parseFloat(stableAmount);
          // Reduce by 0.1% and round down to 6 decimals
          const reduced = numAmount * 0.999;
          adjustedAmount = Math.floor(reduced * 1000000) / 1000000 + '';
        }

        // Log the exact values for debugging
        console.log('Minting with values:', {
          originalAmount: stableAmount,
          adjustedAmount,
          stableBalance,
          decimals,
          stableTokenSymbol: tokenConfig.stableTokenSymbol,
        });

        const amountWei = ethers.parseUnits(adjustedAmount, decimals);
        console.log('Amount in wei:', amountWei.toString());

        return await tokenContract.mint(amountWei);
      });

      // Clear form and refresh balances on success
      setStableAmount('');
      await refreshToken();

      // Refresh stable token balance
      const stableContract = await getStableTokenContract();
      if (stableContract) {
        const balance = await stableContract.balanceOf(user.address);
        const decimals = tokenConfig.stableTokenSymbol === 'USDC' ? 6 : 18;
        setStableBalance(ethers.formatUnits(balance, decimals));
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleMaxAmount = () => {
    // Parse the balance and apply proper decimal formatting
    const balance = parseFloat(stableBalance);
    if (isNaN(balance) || balance === 0) {
      setStableAmount('0');
      return;
    }

    // Apply a safety buffer of 0.01 USDC to account for any precision issues
    // Then round down to 2 decimals for simplicity
    const safeBalance = Math.floor((balance - 0.01) * 100) / 100;

    // Format to 2 decimal places
    const formatted = Math.max(0, safeBalance).toFixed(2);

    setStableAmount(formatted);
  };

  const adjustAmount = (delta: number) => {
    const currentAmount = parseFloat(stableAmount) || 0;
    const newAmount = Math.max(0, currentAmount + delta);
    const maxBalance = parseFloat(stableBalance) || 0;

    if (newAmount <= maxBalance - 0.01) {
      // Round to 2 decimals for consistency
      const formatted = newAmount.toFixed(2);
      setStableAmount(formatted);
    } else {
      // Use the same logic as handleMaxAmount for consistency
      handleMaxAmount();
    }
  };

  const getExchangeTitle = () => {
    if (selectedToken === 'NBGN') {
      return t('web3:exchange.title'); // "Купи лев (с евро)"
    } else if (selectedToken === 'DBGN') {
      return `Купи ${tokenConfig.symbol} (с долари)`;
    } else if (selectedToken === 'GBGN') {
      return `Купи ${tokenConfig.symbol} (със злато)`;
    }
    return `Buy ${tokenConfig.symbol} with ${tokenConfig.stableTokenSymbol}`;
  };

  return (
    <div className="nbgn-widget">
      <h2 className="text-2xl font-bold mb-6">{getExchangeTitle()}</h2>

      <div className="space-y-6">
        {/* Stable Token Balance */}
        <div className="balance-display">
          <span className="balance-label">
            {tokenConfig.stableTokenSymbol} {t('web3:balance', 'Balance')}:{' '}
          </span>
          <span className="balance-value">
            {loading ? '...' : formatStableToken(stableBalance)}{' '}
            {tokenConfig.stableTokenSymbol}
          </span>
        </div>

        {/* Input Amount */}
        <div className="form-group">
          <label className="form-label">
            {tokenConfig.stableTokenSymbol} {t('web3:amount')}
          </label>
          <div className="input-with-max">
            <input
              type="number"
              className="form-input"
              value={stableAmount}
              onChange={e => {
                const value = e.target.value;
                // Allow user to type, but validate on blur
                setStableAmount(value);
              }}
              onBlur={e => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  // Round to 2 decimals and ensure not exceeding balance with buffer
                  const maxBalance = parseFloat(stableBalance) || 0;
                  const safeMax = Math.floor((maxBalance - 0.01) * 100) / 100;
                  const rounded = Math.min(
                    Math.floor(value * 100) / 100,
                    safeMax
                  );
                  setStableAmount(Math.max(0, rounded).toFixed(2));
                } else if (e.target.value === '') {
                  setStableAmount('');
                }
              }}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={loading || isApproving || isMinting}
            />
            <button
              className="max-button"
              onClick={handleMaxAmount}
              disabled={loading || parseFloat(stableBalance) === 0}
            >
              MAX
            </button>
          </div>

          {/* Amount Adjustment Buttons */}
          <div
            className="mt-3 flex flex-wrap justify-center"
            style={{ margin: '16px -4px' }}
          >
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(-5)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-subtract"
                title={`Subtract 5 ${tokenConfig.stableTokenSymbol}`}
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-1)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-subtract"
                title={`Subtract 1 ${tokenConfig.stableTokenSymbol}`}
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-0.5)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-subtract"
                title={`Subtract 0.5 ${tokenConfig.stableTokenSymbol}`}
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-0.05)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-subtract"
                title={`Subtract 0.05 ${tokenConfig.stableTokenSymbol}`}
              >
                -0.05
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(0.05)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-add"
                title={`Add 0.05 ${tokenConfig.stableTokenSymbol}`}
              >
                +0.05
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(0.5)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-add"
                title={`Add 0.5 ${tokenConfig.stableTokenSymbol}`}
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(1)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-add"
                title={`Add 1 ${tokenConfig.stableTokenSymbol}`}
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(5)}
                disabled={loading || isApproving || isMinting}
                className="preset-button-add"
                title={`Add 5 ${tokenConfig.stableTokenSymbol}`}
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Expected Amount */}
        {stableAmount && parseFloat(stableAmount) > 0 && (
          <div className="exchange-info">
            <div className="exchange-rate">
              {t('web3:exchange.rate')}: 1 {tokenConfig.stableTokenSymbol} ={' '}
              {getExchangeRate(selectedToken).toFixed(2)} {tokenConfig.symbol}
            </div>
            <div className="expected-amount">
              {t('web3:exchange.willReceive')}:{' '}
              <strong>
                {expectedTokenAmount} {tokenConfig.symbol}
              </strong>
            </div>
            {tokenConfig.hasTransferFee && (
              <div className="fee-notice">
                <i className="fas fa-info-circle mr-2"></i>
                {tokenConfig.stableTokenSymbol} has a{' '}
                {(tokenConfig.transferFeeRate! / 100).toFixed(2)}% transfer fee
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '32px' }}>
          {needsApproval() ? (
            <button
              className="btn btn-primary w-full"
              onClick={handleApprove}
              disabled={
                !stableAmount || parseFloat(stableAmount) <= 0 || isApproving
              }
            >
              {isApproving ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {t('web3:exchange.approving')}
                </span>
              ) : (
                <span>
                  <i className="fas fa-check mr-2"></i>
                  {t('web3:exchange.approve', {
                    token: tokenConfig.stableTokenSymbol,
                  })}
                </span>
              )}
            </button>
          ) : (
            <button
              className="btn btn-primary w-full"
              onClick={handleMint}
              disabled={
                !stableAmount ||
                parseFloat(stableAmount) <= 0 ||
                parseFloat(stableAmount) > parseFloat(stableBalance) ||
                isMinting
              }
            >
              {isMinting ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {t('web3:exchange.minting')}
                </span>
              ) : (
                <span>
                  <i className="fas fa-coins mr-2"></i>
                  {t('web3:exchange.mint', { token: tokenConfig.symbol })}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Transaction Status */}
        <TransactionStatus status={status} hash={hash} error={error} />
      </div>
    </div>
  );
};
