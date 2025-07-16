import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useAppState } from '../../../contexts/AppContext';
import { useToken } from '../../../hooks/useToken';
import { useTokenContext } from '../../../contexts/TokenContext';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';
import { calculateBurnAmount } from '../../../config/tokens';

export const TokenRedeem: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppState();
  const { selectedToken, getTokenConfig } = useTokenContext();
  const { formattedBalance, rawBalance, getContract, refresh } = useToken();
  const { executeTransaction, status, hash, error } = useTransaction();

  const tokenConfig = getTokenConfig();
  const [tokenAmount, setTokenAmount] = useState('');
  const [expectedStableAmount, setExpectedStableAmount] = useState('0');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Calculate expected stable token amount when token amount changes
  useEffect(() => {
    if (!tokenAmount || isNaN(parseFloat(tokenAmount))) {
      setExpectedStableAmount('0');
      return;
    }

    const expected = calculateBurnAmount(tokenAmount, selectedToken);
    setExpectedStableAmount(expected);
  }, [tokenAmount, selectedToken]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) return;

    setIsRedeeming(true);

    try {
      await executeTransaction(async () => {
        const contract = await getContract();
        if (!contract) throw new Error('Token contract not available');

        const amountWei = ethers.parseEther(tokenAmount);

        // Check balance using user address
        if (!user.address) {
          throw new Error('No user address available');
        }

        const currentBalance = await contract.balanceOf(user.address);
        if (currentBalance < amountWei) {
          throw new Error(`Insufficient ${tokenConfig.symbol} balance`);
        }

        // Execute redeem
        return await contract.redeem(amountWei);
      });

      // Clear form and refresh balance on success
      setTokenAmount('');
      await refresh();
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleMaxAmount = () => {
    setTokenAmount(rawBalance);
  };

  const adjustAmount = (delta: number) => {
    const currentAmount = parseFloat(tokenAmount) || 0;
    const newAmount = Math.max(0, currentAmount + delta);
    const maxBalance = parseFloat(rawBalance) || 0;

    if (newAmount <= maxBalance) {
      setTokenAmount(newAmount.toFixed(2));
    } else {
      setTokenAmount(maxBalance.toFixed(2));
    }
  };

  // Format stable token with appropriate decimals
  const formatStableToken = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.00';

    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getRedeemTitle = () => {
    if (selectedToken === 'NBGN') {
      return t('web3:redeem.title'); // "Продай лев (за евро)"
    } else if (selectedToken === 'DBGN') {
      return `Продай ${tokenConfig.symbol} (за долари)`;
    } else if (selectedToken === 'GBGN') {
      return `Продай ${tokenConfig.symbol} (за злато)`;
    }
    return `Sell ${tokenConfig.symbol} for ${tokenConfig.stableTokenSymbol}`;
  };

  return (
    <div className="nbgn-widget">
      <h2 className="text-2xl font-bold mb-6">{getRedeemTitle()}</h2>

      <form onSubmit={handleRedeem} className="space-y-6">
        {/* Token Balance */}
        <div className="balance-display">
          <span className="balance-label">
            {t('web3:balanceWithToken.token', { token: tokenConfig.symbol })}
            :{' '}
          </span>
          <span className="balance-value">
            {formattedBalance} {tokenConfig.symbol}
          </span>
        </div>

        {/* Input Amount */}
        <div className="form-group">
          <label className="form-label">
            {t('web3:redeem.amount', { token: tokenConfig.symbol })}
          </label>
          <div className="input-with-max">
            <input
              type="number"
              className="form-input"
              value={tokenAmount}
              onChange={e => setTokenAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isRedeeming}
            />
            <button
              type="button"
              className="max-button"
              onClick={handleMaxAmount}
              disabled={parseFloat(rawBalance) === 0}
            >
              MAX
            </button>
          </div>

          {/* Amount Adjustment Buttons */}
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(-1)}
                className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                title={`Subtract 1 ${tokenConfig.symbol}`}
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-0.5)}
                className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                title={`Subtract 0.5 ${tokenConfig.symbol}`}
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-0.05)}
                className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                title={`Subtract 0.05 ${tokenConfig.symbol}`}
              >
                -0.05
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(0.05)}
                className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                title={`Add 0.05 ${tokenConfig.symbol}`}
              >
                +0.05
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(0.5)}
                className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                title={`Add 0.5 ${tokenConfig.symbol}`}
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(1)}
                className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                title={`Add 1 ${tokenConfig.symbol}`}
              >
                +1
              </button>
            </div>
          </div>
        </div>

        {/* Expected Amount */}
        {tokenAmount && parseFloat(tokenAmount) > 0 && (
          <div className="exchange-info">
            <div className="exchange-rate">
              {t('web3:redeem.rate')}: 1 {tokenConfig.symbol} ={' '}
              {tokenConfig.pegRate} {tokenConfig.stableTokenSymbol}
            </div>
            <div className="expected-amount">
              {t('web3:redeem.willReceive')}:{' '}
              <strong>
                {formatStableToken(expectedStableAmount)}{' '}
                {tokenConfig.stableTokenSymbol}
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

        {/* Warning Message */}
        <div className="warning-box">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {t('web3:redeem.warning', { token: tokenConfig.symbol })}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-danger w-full"
          disabled={
            !tokenAmount ||
            parseFloat(tokenAmount) <= 0 ||
            parseFloat(tokenAmount) > parseFloat(rawBalance) ||
            isRedeeming
          }
        >
          {isRedeeming ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {t('web3:redeem.redeeming')}
            </span>
          ) : (
            <span>
              <i className="fas fa-fire mr-2"></i>
              {t('web3:redeem.submit', { token: tokenConfig.symbol })}
            </span>
          )}
        </button>

        {/* Transaction Status */}
        <TransactionStatus status={status} hash={hash} error={error} />
      </form>
    </div>
  );
};
