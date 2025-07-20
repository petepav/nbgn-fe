import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { voucherAPI } from '../../services/voucherAPI';
import { createVoucherOnChain, generateVoucherId } from '../../services/voucherContract';
import { QRCodeSVG } from 'qrcode.react';
import './VoucherCreate.css';

export const VoucherCreate: React.FC = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('604800'); // 7 days in seconds
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdVoucher, setCreatedVoucher] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError(t('voucher:connectWalletFirst', 'Please connect your wallet first'));
      return;
    }
    
    if (password && password !== confirmPassword) {
      setError(t('voucher:passwordMismatch', 'Passwords do not match'));
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      // Step 1: Generate voucher ID
      const voucherId = generateVoucherId();
      
      // Step 2: Create voucher on blockchain
      const { transactionHash, voucherId: emittedVoucherId } = await createVoucherOnChain(voucherId, amount);
      
      // Step 3: Generate shareable link through backend
      const linkResult = await voucherAPI.createVoucherLink({
        voucher_id: emittedVoucherId,
        password: password || undefined,
      });
      
      // Debug logging to see actual response structure
      console.log('Link API Response:', linkResult);
      console.log('Available keys:', Object.keys(linkResult));
      console.log('Created voucher with ID:', emittedVoucherId);
      console.log('Full response:', JSON.stringify(linkResult, null, 2));
      
      // Check if we got the expected response structure
      if (!linkResult.shareable_link && !linkResult.shareable_code) {
        console.error('Invalid API response structure:', linkResult);
        throw new Error('Invalid response from voucher link API - missing shareable_link or shareable_code');
      }
      
      // Use the shareable_link directly if provided, otherwise build it from code
      let shareUrl: string;
      let shareCode: string;
      
      if (linkResult.shareable_link) {
        // API provides the link - extract the code and build proper hash URL
        const match = linkResult.shareable_link.match(/\/claim\/([^/?]+)/);
        if (match) {
          shareCode = match[1];
          shareUrl = `${window.location.origin}/#/claim/${shareCode}`;
        } else if (linkResult.shareable_link.includes('/')) {
          // Has slashes but no /claim/ - might be just /CODE
          const parts = linkResult.shareable_link.split('/');
          shareCode = parts[parts.length - 1] || emittedVoucherId;
          shareUrl = `${window.location.origin}/#/claim/${shareCode}`;
        } else {
          // Just a code
          shareCode = linkResult.shareable_link;
          shareUrl = `${window.location.origin}/#/claim/${shareCode}`;
        }
      } else if (linkResult.shareable_code) {
        // API provides just the code
        shareCode = linkResult.shareable_code;
        shareUrl = `${window.location.origin}/#/claim/${shareCode}`;
      } else {
        // Fallback - use voucher ID
        console.warn('Using voucher ID as fallback for share code');
        shareCode = emittedVoucherId;
        shareUrl = `${window.location.origin}/#/claim/${shareCode}`;
      }
      
      // Format result for display
      setCreatedVoucher({
        voucherId: emittedVoucherId,
        amount,
        shareableLink: shareUrl,
        shareableCode: shareCode,
        transactionHash,
      });
      
      setAmount('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Voucher creation error:', err);
      setError(err.message || t('voucher:createError', 'Failed to create voucher'));
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = () => {
    if (createdVoucher?.shareableLink) {
      navigator.clipboard.writeText(createdVoucher.shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareVoucher = () => {
    if (navigator.share && createdVoucher?.shareableLink) {
      navigator.share({
        title: t('voucher:shareTitle', 'NBGN Voucher'),
        text: t('voucher:shareText', 'I sent you {{amount}} NBGN!', { amount: createdVoucher.amount }),
        url: createdVoucher.shareableLink,
      });
    }
  };

  if (createdVoucher) {
    return (
      <div className="voucher-create-success">
        <div className="success-header">
          <i className="fas fa-check-circle"></i>
          <h3>{t('voucher:createSuccess', 'Voucher Created Successfully!')}</h3>
        </div>
        
        <div className="voucher-details">
          <p className="amount">{createdVoucher.amount} NBGN</p>
          {createdVoucher.expiresAt && (
            <p className="expires">
              {t('voucher:expiresAt', 'Expires: {{date}}', {
                date: new Date(createdVoucher.expiresAt).toLocaleDateString()
              })}
            </p>
          )}
        </div>

        <div className="share-section">
          <div className="link-box">
            <input
              type="text"
              value={createdVoucher.shareableLink}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            />
            <button onClick={copyLink} className="copy-btn">
              {copied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
            </button>
          </div>

          <div className="share-buttons">
            <button onClick={() => setShowQR(!showQR)} className="btn btn-secondary">
              <i className="fas fa-qrcode"></i>
              {showQR ? t('voucher:hideQR', 'Hide QR') : t('voucher:showQR', 'Show QR')}
            </button>
            
            {'share' in navigator && (
              <button onClick={shareVoucher} className="btn btn-secondary">
                <i className="fas fa-share"></i>
                {t('common.share', 'Share')}
              </button>
            )}
          </div>

          {showQR && (
            <div className="qr-code-container">
              <QRCodeSVG
                value={createdVoucher.shareableLink}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          )}
        </div>

        {password && (
          <div className="password-reminder">
            <i className="fas fa-lock"></i>
            <p>{t('voucher:passwordReminder', 'Remember to share the password separately!')}</p>
          </div>
        )}

        <button
          onClick={() => setCreatedVoucher(null)}
          className="btn btn-primary"
        >
          {t('voucher:createAnother', 'Create Another Voucher')}
        </button>
      </div>
    );
  }

  return (
    <div className="voucher-create">
      <h3>{t('voucher:createTitle', 'Create NBGN Voucher')}</h3>
      
      {!isConnected && (
        <div className="connect-warning">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{t('voucher:connectRequired', 'Please connect your wallet to create vouchers')}</p>
        </div>
      )}

      <form onSubmit={handleCreate} className="create-form">
        <div className="form-group">
          <label>{t('voucher:amount', 'Amount (NBGN)')}</label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            required
            disabled={!isConnected}
          />
        </div>

        <div className="form-group">
          <label>{t('voucher:expiration', 'Expiration')}</label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            disabled={!isConnected}
          >
            <option value="3600">{t('voucher:exp1Hour', '1 Hour')}</option>
            <option value="86400">{t('voucher:exp1Day', '1 Day')}</option>
            <option value="604800">{t('voucher:exp7Days', '7 Days')}</option>
            <option value="2592000">{t('voucher:exp30Days', '30 Days')}</option>
          </select>
        </div>

        <div className="password-section">
          <h4>{t('voucher:optionalPassword', 'Optional Password Protection')}</h4>
          <p className="helper-text">
            {t('voucher:passwordHelp', 'Add a password to make the voucher more secure')}
          </p>
          
          <div className="form-group">
            <label>{t('voucher:password', 'Password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('voucher:passwordOptional', 'Optional')}
              disabled={!isConnected}
            />
          </div>

          {password && (
            <div className="form-group">
              <label>{t('voucher:confirmPassword', 'Confirm Password')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('voucher:confirmPasswordPlaceholder', 'Confirm password')}
                required={!!password}
                disabled={!isConnected}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isConnected || isCreating || !amount}
          className="btn btn-primary"
        >
          {isCreating ? (
            <span>
              <i className="fas fa-spinner fa-spin"></i>
              {t('voucher:creating', 'Creating...')}
            </span>
          ) : (
            <span>
              <i className="fas fa-gift"></i>
              {t('voucher:createButton', 'Create Voucher')}
            </span>
          )}
        </button>
      </form>

      <div className="info-section">
        <h4>{t('voucher:howItWorks', 'How it works')}</h4>
        <ul>
          <li>{t('voucher:step1', 'Enter the amount of NBGN you want to send')}</li>
          <li>{t('voucher:step2', 'Optionally add a password for extra security')}</li>
          <li>{t('voucher:step3', 'Share the link with the recipient')}</li>
          <li>{t('voucher:step4', 'They can claim without a wallet!')}</li>
        </ul>
      </div>
    </div>
  );
};