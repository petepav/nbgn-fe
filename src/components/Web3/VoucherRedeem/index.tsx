import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  parseVoucherFromLink,
  decryptVoucher,
  isVoucherExpired,
} from '../../../utils/voucher';
import './VoucherRedeem.css';

export const VoucherRedeem: React.FC = () => {
  const { t } = useTranslation();
  const { voucherData } = useParams<{ voucherData: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [decryptedData, setDecryptedData] =
    useState<ReturnType<typeof decryptVoucher>>(null);

  useEffect(() => {
    // Validate voucher data on mount
    if (!voucherData || !parseVoucherFromLink(voucherData)) {
      setError(t('web3:voucher.invalidLink', 'Invalid voucher link'));
    }
  }, [voucherData, t]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!voucherData || !password) {
      return;
    }

    setIsRedeeming(true);

    try {
      // Parse and decrypt voucher
      const encryptedVoucher = parseVoucherFromLink(voucherData);
      if (!encryptedVoucher) {
        throw new Error(t('web3:voucher.invalidLink', 'Invalid voucher link'));
      }

      const voucher = decryptVoucher(encryptedVoucher, password);
      if (!voucher) {
        throw new Error(t('web3:voucher.wrongPassword', 'Incorrect password'));
      }

      // Check if expired
      if (isVoucherExpired(voucher)) {
        throw new Error(t('web3:voucher.expired', 'This voucher has expired'));
      }

      setDecryptedData(voucher);

      // Import the wallet to MetaMask
      if (window.ethereum) {
        try {
          // First, prompt user to connect wallet if not connected
          await window.ethereum.request({
            method: 'eth_requestAccounts',
          });

          // Import the private key
          // Note: MetaMask doesn't have a direct API to import private keys
          // We'll show the private key for manual import
          setSuccess(true);
        } catch (err) {
          console.error('Failed to import wallet:', err);
          // Still show success since we have the private key
          setSuccess(true);
        }
      } else {
        // No MetaMask, just show the private key
        setSuccess(true);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('web3:voucher.redeemError', 'Failed to redeem voucher');
      setError(errorMessage);
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyPrivateKey = async () => {
    if (decryptedData?.privateKey) {
      try {
        await window.navigator.clipboard.writeText(decryptedData.privateKey);
        // Show copied notification
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (success && decryptedData) {
    return (
      <div className="voucher-redeem-container">
        <div className="voucher-redeem-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            {t('web3:voucher.redeemSuccess', 'Voucher Redeemed Successfully!')}
          </h2>

          <div className="voucher-details">
            <p className="detail-item">
              <strong>{t('web3:voucher.amount', 'Amount')}:</strong>{' '}
              {decryptedData.amount} {decryptedData.token}
            </p>
            <p className="detail-item">
              <strong>
                {t('web3:voucher.walletAddress', 'Wallet Address')}:
              </strong>
              <span className="mono-text">{decryptedData.address}</span>
            </p>
          </div>

          <div className="import-instructions">
            <h3 className="text-lg font-semibold mb-3">
              {t('web3:voucher.importInstructions', 'To access your funds:')}
            </h3>

            <ol className="instruction-list">
              <li>{t('web3:voucher.step1', 'Open MetaMask')}</li>
              <li>{t('web3:voucher.step2', 'Click on your account icon')}</li>
              <li>{t('web3:voucher.step3', 'Select "Import Account"')}</li>
              <li>{t('web3:voucher.step4', 'Choose "Private Key" option')}</li>
              <li>{t('web3:voucher.step5', 'Paste the private key below')}</li>
            </ol>

            <div className="private-key-container">
              <div className="private-key-label">
                <i className="fas fa-key mr-2"></i>
                {t('web3:voucher.privateKey', 'Private Key')}
              </div>
              <div className="private-key-box">
                <input
                  type="password"
                  value={decryptedData.privateKey}
                  readOnly
                  className="private-key-input"
                  onClick={e => e.currentTarget.select()}
                />
                <button
                  onClick={copyPrivateKey}
                  className="copy-button"
                  title={t('common:copy', 'Copy')}
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
              <p className="security-warning">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {t(
                  'web3:voucher.privateKeyWarning',
                  'Keep this private key secure! Anyone with this key can access the funds.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full mt-6"
          >
            <i className="fas fa-home mr-2"></i>
            {t('common:goHome', 'Go to Home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-redeem-container">
      <div className="voucher-redeem-card">
        <h2 className="text-2xl font-bold mb-6">
          <i className="fas fa-ticket mr-2"></i>
          {t('web3:voucher.redeemTitle', 'Redeem NBGN Voucher')}
        </h2>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              {t('web3:voucher.enterPassword', 'Enter Voucher Password')}
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t(
                'web3:voucher.passwordPlaceholder',
                'Enter password'
              )}
              required
              disabled={isRedeeming || !!error}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!password || isRedeeming || !!error}
          >
            {isRedeeming ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {t('web3:voucher.redeeming', 'Redeeming...')}
              </span>
            ) : (
              <span>
                <i className="fas fa-unlock mr-2"></i>
                {t('web3:voucher.redeemButton', 'Redeem Voucher')}
              </span>
            )}
          </button>
        </form>

        <div className="help-text">
          <p>
            {t(
              'web3:voucher.helpText',
              'Enter the password provided by the person who sent you this voucher.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
