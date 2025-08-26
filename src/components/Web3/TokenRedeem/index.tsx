import React, { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdjustingRef = useRef(false);

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
    // Set flag to prevent onBlur from interfering
    isAdjustingRef.current = true;

    // Get the current value directly from state
    const currentValue = tokenAmount || '0';
    const currentAmount =
      currentValue === '' ? 0 : parseFloat(currentValue) || 0;
    const newAmount = Math.max(0, currentAmount + delta);
    const maxBalance = parseFloat(rawBalance) || 0;

    if (newAmount === 0) {
      setTokenAmount('');
    } else if (newAmount <= maxBalance) {
      setTokenAmount(newAmount.toFixed(2));
    } else {
      setTokenAmount(maxBalance.toFixed(2));
    }

    // Reset flag after a short delay
    window.setTimeout(() => {
      isAdjustingRef.current = false;
    }, 100);
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
      return `Продай ${tokenConfig.symbol}`;
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
              ref={inputRef}
              type="text"
              className="form-input"
              value={tokenAmount}
              onChange={e => {
                const value = e.target.value;
                // Allow typing decimal numbers
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  // Remove leading zeros unless it's "0" or "0."
                  let cleanValue = value;
                  if (
                    value.length > 1 &&
                    value[0] === '0' &&
                    value[1] !== '.'
                  ) {
                    cleanValue = value.substring(1);
                  }
                  setTokenAmount(cleanValue);
                }
              }}
              onBlur={e => {
                // Skip onBlur if we're adjusting via buttons
                if (isAdjustingRef.current) return;

                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  const maxBalance = parseFloat(rawBalance) || 0;
                  const rounded = Math.min(value, maxBalance);
                  setTokenAmount(rounded.toFixed(2));
                } else if (e.target.value === '') {
                  setTokenAmount('');
                }
              }}
              placeholder="0.00"
              inputMode="decimal"
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
          <div
            style={{
              marginTop: '8px',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <div className="flex gap-1">
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(-5);
                }}
                className="preset-button-subtract"
                title={`Subtract 5 ${tokenConfig.symbol}`}
              >
                -5
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(-1);
                }}
                className="preset-button-subtract"
                title={`Subtract 1 ${tokenConfig.symbol}`}
              >
                -1
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(-0.5);
                }}
                className="preset-button-subtract"
                title={`Subtract 0.5 ${tokenConfig.symbol}`}
              >
                -0.5
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(-0.05);
                }}
                className="preset-button-subtract"
                title={`Subtract 0.05 ${tokenConfig.symbol}`}
              >
                -0.05
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(0.05);
                }}
                className="preset-button-add"
                title={`Add 0.05 ${tokenConfig.symbol}`}
              >
                +0.05
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(0.5);
                }}
                className="preset-button-add"
                title={`Add 0.5 ${tokenConfig.symbol}`}
              >
                +0.5
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(1);
                }}
                className="preset-button-add"
                title={`Add 1 ${tokenConfig.symbol}`}
              >
                +1
              </button>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  adjustAmount(5);
                }}
                className="preset-button-add"
                title={`Add 5 ${tokenConfig.symbol}`}
              >
                +5
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

        {/* Submit Button */}
        <div style={{ marginTop: '32px' }}>
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
        </div>

        {/* Transaction Status */}
        <TransactionStatus status={status} hash={hash} error={error} />
      </form>
    </div>
  );
};
