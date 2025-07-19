import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import {
  parseVoucherFromLink,
  decryptVoucher,
  isVoucherExpired,
} from '../../../utils/voucher';
import { SUPPORTED_TOKENS } from '../../../config/tokens';
import { NBGN_ABI } from '../../../contracts/abis/NBGN';
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
  const [redeemMethod, setRedeemMethod] = useState<'import' | 'transfer'>(
    'transfer'
  );
  const [targetWallet, setTargetWallet] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showEthRecovery, setShowEthRecovery] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');

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
      setSuccess(true);
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

  const handleTransfer = async () => {
    if (!decryptedData || !targetWallet) return;

    setIsTransferring(true);
    setError('');

    try {
      // Validate target wallet address
      if (!ethers.isAddress(targetWallet)) {
        throw new Error(
          t('web3:voucher.invalidTargetAddress', 'Invalid wallet address')
        );
      }

      // Get the token config
      const tokenConfig = SUPPORTED_TOKENS[decryptedData.token];
      if (!tokenConfig) {
        throw new Error('Invalid token');
      }

      // Create provider and check if user has a connected wallet
      if (!window.ethereum) {
        throw new Error(
          t(
            'web3:voucher.noWallet',
            'Please install MetaMask to transfer tokens'
          )
        );
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check if voucher wallet has gas
      const voucherWallet = new ethers.Wallet(
        decryptedData.privateKey,
        provider
      );
      const gasBalance = await provider.getBalance(voucherWallet.address);

      if (gasBalance.toString() === '0') {
        // No gas in voucher wallet - we'll need the user to send the transaction

        // Can't use transferFrom without approval from voucher wallet
        // For now, we'll just inform the user they need to use import option
        throw new Error(
          t(
            'web3:voucher.noGasInVoucher',
            'The voucher wallet has no gas. Please use the "Import Private Key" option instead.'
          )
        );
      }

      // Voucher wallet has gas, proceed with transfer
      const tokenContract = new ethers.Contract(
        tokenConfig.address,
        NBGN_ABI,
        voucherWallet
      );

      // Get token balance
      const balance = await tokenContract.balanceOf(voucherWallet.address);

      if (balance.toString() === '0') {
        throw new Error(
          t('web3:voucher.noTokens', 'This voucher has already been redeemed')
        );
      }

      // Transfer all tokens
      const tx = await tokenContract.transfer(targetWallet, balance);
      setTxHash(tx.hash);

      // Wait for confirmation
      await tx.wait();

      setTransferSuccess(true);

      // Check if there's remaining ETH in the voucher and automatically return it to creator
      const remainingEth = await provider.getBalance(voucherWallet.address);
      if (remainingEth > 0) {
        try {
          // Calculate gas cost for transfer
          const gasPrice = await provider.getFeeData();
          const gasCost = BigInt(21000) * (gasPrice.gasPrice || BigInt(0));

          if (remainingEth > gasCost) {
            // Send remaining ETH minus gas cost back to creator
            const amountToSend = remainingEth - gasCost;

            const ethTx = await voucherWallet.sendTransaction({
              to: decryptedData.creatorAddress,
              value: amountToSend,
            });

            await ethTx.wait();

            // Show the amount that was returned
            setEthBalance(ethers.formatEther(amountToSend));
            setShowEthRecovery(true); // Still show notification but as completed
          }
        } catch (err) {
          console.error('Failed to return ETH to creator:', err);
          // Don't block the main flow if ETH return fails
        }
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('web3:voucher.transferError', 'Failed to transfer tokens');
      setError(errorMessage);
    } finally {
      setIsTransferring(false);
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
          </div>

          {transferSuccess ? (
            <div className="transfer-success">
              <i className="fas fa-check-circle text-green-600 text-5xl mb-4"></i>
              <h3 className="text-xl font-bold mb-2">
                {t('web3:voucher.transferComplete', 'Transfer Complete!')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t(
                  'web3:voucher.transferSuccessMsg',
                  'The tokens have been transferred to your wallet.'
                )}
              </p>
              {txHash && (
                <a
                  href={`https://arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {t('web3:voucher.viewTransaction', 'View Transaction')}
                </a>
              )}

              {showEthRecovery && (
                <div className="eth-recovery-section">
                  <div
                    className="eth-recovery-notice"
                    style={{
                      background:
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginTop: '16px',
                    }}
                  >
                    <i className="fas fa-check-circle mr-2"></i>
                    <span>
                      {t(
                        'web3:voucher.ethReturnedToCreator',
                        'Remaining ETH ({{amount}} ETH) was returned to the voucher creator',
                        { amount: ethBalance }
                      )}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/')}
                className="btn btn-primary w-full mt-6"
              >
                <i className="fas fa-home mr-2"></i>
                {t('common:goHome', 'Go to Home')}
              </button>
            </div>
          ) : (
            <div className="redeem-options">
              <h3 className="text-lg font-semibold mb-4">
                {t(
                  'web3:voucher.chooseRedeemMethod',
                  'Choose how to redeem your voucher:'
                )}
              </h3>

              <div className="method-selector">
                <button
                  className={`method-button ${redeemMethod === 'transfer' ? 'active' : ''}`}
                  onClick={() => setRedeemMethod('transfer')}
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  {t('web3:voucher.transferToWallet', 'Transfer to My Wallet')}
                </button>
                <button
                  className={`method-button ${redeemMethod === 'import' ? 'active' : ''}`}
                  onClick={() => setRedeemMethod('import')}
                >
                  <i className="fas fa-key mr-2"></i>
                  {t('web3:voucher.importPrivateKey', 'Import Private Key')}
                </button>
              </div>

              {redeemMethod === 'transfer' ? (
                <div className="transfer-section">
                  <p className="text-sm text-gray-600 mb-4">
                    {t(
                      'web3:voucher.transferDescription',
                      "Enter your wallet address and we'll transfer the tokens directly to you. No gas fees required!"
                    )}
                  </p>

                  <div className="form-group">
                    <label className="form-label">
                      {t(
                        'web3:voucher.yourWalletAddress',
                        'Your Wallet Address'
                      )}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={targetWallet}
                      onChange={e => setTargetWallet(e.target.value)}
                      placeholder="0x..."
                      disabled={isTransferring}
                    />
                  </div>

                  {error && (
                    <div className="error-message mb-4">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleTransfer}
                    className="btn btn-primary w-full"
                    disabled={!targetWallet || isTransferring}
                  >
                    {isTransferring ? (
                      <span className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t('web3:voucher.transferring', 'Transferring...')}
                      </span>
                    ) : (
                      <span>
                        <i className="fas fa-paper-plane mr-2"></i>
                        {t('web3:voucher.transferButton', 'Transfer Tokens')}
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="import-instructions">
                  <h3 className="text-lg font-semibold mb-3">
                    {t(
                      'web3:voucher.importInstructions',
                      'To access your funds:'
                    )}
                  </h3>

                  <ol className="instruction-list">
                    <li>{t('web3:voucher.step1', 'Open MetaMask')}</li>
                    <li>
                      {t('web3:voucher.step2', 'Click on your account icon')}
                    </li>
                    <li>
                      {t('web3:voucher.step3', 'Select "Import Account"')}
                    </li>
                    <li>
                      {t('web3:voucher.step4', 'Choose "Private Key" option')}
                    </li>
                    <li>
                      {t('web3:voucher.step5', 'Paste the private key below')}
                    </li>
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
                    <p className="gas-warning">
                      <i className="fas fa-info-circle mr-2"></i>
                      {t(
                        'web3:voucher.gasWarning',
                        'Note: You will need ETH/ARB for gas fees to transfer tokens from this wallet.'
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
        <div className="voucher-icon">
          <i className="fas fa-gift"></i>
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {t('web3:voucher.redeemTitle', 'Redeem NBGN Voucher')}
        </h2>

        <p className="intro-text">
          {t(
            'web3:voucher.redeemIntro',
            'Enter your voucher password to claim your tokens'
          )}
        </p>

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
