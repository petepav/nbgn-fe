import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useTokenContext } from '../../../contexts/TokenContext';
import { useToken } from '../../../hooks/useToken';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';
import {
  generateVoucherWallet,
  encryptVoucher,
  createVoucherLink,
  VoucherData,
} from '../../../utils/voucher';
import './VoucherWidget.css';

type VoucherMode = 'create' | 'redeem';

export const VoucherWidget: React.FC = () => {
  const { t } = useTranslation();
  const { selectedToken, getTokenConfig } = useTokenContext();
  const { formattedBalance, rawBalance, transfer } = useToken();
  const { executeTransaction, status, hash, error } = useTransaction();

  const [mode, setMode] = useState<VoucherMode>('create');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [voucherLink, setVoucherLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [includeGas, setIncludeGas] = useState(true);
  const [gasAmount] = useState('0.001'); // ~$2-3 worth of ETH

  const tokenConfig = getTokenConfig();

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !password || password !== confirmPassword) {
      return;
    }

    setIsCreating(true);

    try {
      // Generate new wallet for voucher
      const voucherWallet = generateVoucherWallet();

      // Create voucher data
      const voucherData: VoucherData = {
        privateKey: voucherWallet.privateKey,
        address: voucherWallet.address,
        amount: amount,
        token: selectedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      // Transfer tokens to voucher wallet
      await executeTransaction(async () => {
        return await transfer(voucherWallet.address, amount);
      });

      // If includeGas is true, also send some ETH/ARB for gas
      if (includeGas) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          // Send gas to voucher wallet
          const gasTx = await signer.sendTransaction({
            to: voucherWallet.address,
            value: ethers.parseEther(gasAmount),
          });

          // Wait for gas transaction to confirm
          await gasTx.wait();
        } catch (err) {
          console.error('Failed to send gas to voucher wallet:', err);
          // Continue anyway - voucher is still valid, just needs manual gas
        }
      }

      // Encrypt voucher data
      const encryptedVoucher = encryptVoucher(voucherData, password);

      // Create shareable link
      const link = createVoucherLink(encryptedVoucher);
      setVoucherLink(link);

      // Clear form
      setAmount('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to create voucher:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await window.navigator.clipboard.writeText(voucherLink);
      setShowCopiedNotification(true);
      window.setTimeout(() => setShowCopiedNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleMaxAmount = () => {
    const balance = parseFloat(rawBalance);
    if (balance > 0.1) {
      setAmount((balance - 0.1).toFixed(2)); // Leave 0.1 for gas
    }
  };

  const adjustAmount = (delta: number) => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.max(0, currentAmount + delta);
    const maxBalance = parseFloat(rawBalance) || 0;

    if (newAmount <= maxBalance - 0.1) {
      setAmount(newAmount.toFixed(2));
    } else {
      handleMaxAmount();
    }
  };

  return (
    <div className="nbgn-widget voucher-widget">
      <h2 className="text-2xl font-bold mb-6">
        {t('web3:voucher.title', 'NBGN Voucher')}
      </h2>

      {/* Beta Warning */}
      <div className="beta-warning">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        <div>
          <strong>{t('web3:voucher.betaTitle', 'Beta Feature')}</strong>
          <p>
            {t(
              'web3:voucher.betaWarning',
              'This feature is still in beta. Please only use small amounts for testing.'
            )}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="voucher-mode-toggle">
        <button
          className={`voucher-mode-button ${mode === 'create' ? 'active' : ''}`}
          onClick={() => setMode('create')}
        >
          <i className="fas fa-gift mr-2"></i>
          {t('web3:voucher.create', 'Create Voucher')}
        </button>
        <button
          className={`voucher-mode-button ${mode === 'redeem' ? 'active' : ''}`}
          onClick={() => setMode('redeem')}
        >
          <i className="fas fa-ticket mr-2"></i>
          {t('web3:voucher.redeem', 'Redeem Voucher')}
        </button>
      </div>

      {mode === 'create' ? (
        <>
          {/* Balance Display */}
          <div className="balance-display mb-4">
            <span className="balance-label">
              {tokenConfig.symbol} {t('web3:balance')}:
            </span>
            <span className="balance-value">{formattedBalance}</span>
          </div>

          {!voucherLink ? (
            <form onSubmit={handleCreateVoucher} className="space-y-4">
              {/* Amount Input */}
              <div className="form-group">
                <label className="form-label">
                  {t('web3:voucher.amount', 'Voucher Amount')}
                </label>
                <div className="input-with-max">
                  <input
                    type="number"
                    className="form-input"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    disabled={isCreating}
                  />
                  <button
                    type="button"
                    className="max-button"
                    onClick={handleMaxAmount}
                    disabled={isCreating || parseFloat(rawBalance) === 0}
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
                    {[-5, -1, -0.5, -0.05].map(delta => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => adjustAmount(delta)}
                        disabled={isCreating}
                        className="preset-button-subtract"
                        title={`Subtract ${Math.abs(delta)} ${tokenConfig.symbol}`}
                      >
                        {delta}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {[0.05, 0.5, 1, 5].map(delta => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => adjustAmount(delta)}
                        disabled={isCreating}
                        className="preset-button-add"
                        title={`Add ${delta} ${tokenConfig.symbol}`}
                      >
                        +{delta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label className="form-label">
                  {t('web3:voucher.password', 'Voucher Password')}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t(
                    'web3:voucher.passwordPlaceholder',
                    'Enter a secure password'
                  )}
                  required
                  disabled={isCreating}
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">
                  {t('web3:voucher.confirmPassword', 'Confirm Password')}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t(
                    'web3:voucher.confirmPasswordPlaceholder',
                    'Re-enter password'
                  )}
                  required
                  disabled={isCreating}
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">
                    {t(
                      'web3:voucher.passwordMismatch',
                      'Passwords do not match'
                    )}
                  </p>
                )}
              </div>

              {/* Include Gas Option */}
              <div className="gas-option">
                <label className="gas-checkbox">
                  <input
                    type="checkbox"
                    checked={includeGas}
                    onChange={e => setIncludeGas(e.target.checked)}
                    disabled={isCreating}
                  />
                  <span>
                    {t(
                      'web3:voucher.includeGas',
                      'Include gas for easy redemption'
                    )}{' '}
                    ({gasAmount} ETH)
                  </span>
                </label>
                <p className="gas-description">
                  {t(
                    'web3:voucher.gasDescription',
                    'Allows recipient to transfer tokens without needing gas'
                  )}
                </p>
              </div>

              {/* Create Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={
                  !amount ||
                  !password ||
                  password !== confirmPassword ||
                  parseFloat(amount) > parseFloat(rawBalance) ||
                  isCreating ||
                  status === 'pending'
                }
              >
                {isCreating || status === 'pending' ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t('web3:voucher.creating', 'Creating Voucher...')}
                  </span>
                ) : (
                  <span>
                    <i className="fas fa-gift mr-2"></i>
                    {t('web3:voucher.createButton', 'Create Voucher')}
                  </span>
                )}
              </button>
            </form>
          ) : (
            /* Voucher Created Success */
            <div className="voucher-success">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">
                {t('web3:voucher.created', 'Voucher Created!')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t(
                  'web3:voucher.shareInstructions',
                  'Share this link with the recipient. They will need the password to redeem the voucher.'
                )}
              </p>

              <div className="voucher-link-container">
                <input
                  type="text"
                  value={voucherLink}
                  readOnly
                  className="voucher-link-input"
                  onClick={e => e.currentTarget.select()}
                />
                <button
                  onClick={copyToClipboard}
                  className="copy-button"
                  title={t('common:copy', 'Copy')}
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>

              {showCopiedNotification && (
                <div className="copied-notification">
                  {t('common:copied', 'Copied!')}
                </div>
              )}

              <button
                onClick={() => {
                  setVoucherLink('');
                  setAmount('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="btn btn-secondary mt-4"
              >
                <i className="fas fa-plus mr-2"></i>
                {t('web3:voucher.createAnother', 'Create Another Voucher')}
              </button>
            </div>
          )}

          <TransactionStatus status={status} hash={hash} error={error} />
        </>
      ) : (
        /* Redeem Mode */
        <div className="redeem-placeholder">
          <i className="fas fa-ticket text-6xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">
            {t(
              'web3:voucher.redeemInstructions',
              'To redeem a voucher, click on the voucher link you received.'
            )}
          </p>
        </div>
      )}
    </div>
  );
};
