import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccount, useConnect } from 'wagmi';
import { formatEther } from 'viem';
import { voucherAPI } from '../../services/voucherAPI';
import { claimVoucherOnChain, testClaimWithJennysParams } from '../../services/voucherContract';
import { QRCodeSVG } from 'qrcode.react';
import './VoucherClaim.css';

interface VoucherInfo {
  amount?: string;
  voucherId?: string;
  deadline?: number;
  signature?: string;
  contract_address?: string;
  hasPassword?: boolean;
  claimSignature?: string;
  claimDeadline?: number;
  actualVoucherId?: string;
}

export const VoucherClaim: React.FC = () => {
  const { t } = useTranslation();
  const { voucherId } = useParams<{ voucherId: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  const [password, setPassword] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState('');
  const [voucherInfo, setVoucherInfo] = useState<VoucherInfo | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    if (voucherId && !hasVerified) {
      setHasVerified(true);
      verifyVoucher();
    }
  }, [voucherId, hasVerified]);

  useEffect(() => {
    if (isConnected && address) {
      setTargetAddress(address);
    }
  }, [isConnected, address]);

  const verifyVoucher = async () => {
    if (!voucherId) return;
    
    setIsVerifying(true);
    setError('');
    
    try {
      console.log('Verifying voucher with code:', voucherId);
      
      // The voucherId from URL params is actually the shareable code
      const result = await voucherAPI.verifyVoucher({ 
        code: voucherId,
        password: password || undefined 
      });
      
      console.log('Verify response:', result);
      console.log('Voucher object:', result.voucher);
      console.log('Amount field RAW:', result.voucher?.amount);
      console.log('Amount type:', typeof result.voucher?.amount);
      console.log('Full voucher data:', JSON.stringify(result.voucher, null, 2));
      console.log('Available voucher fields:', result.voucher ? Object.keys(result.voucher) : 'no voucher object');
      
      if (!result.valid) {
        setError(t('voucher:invalid', 'Invalid voucher'));
      } else if (result.voucher?.cancelled) {
        setError(t('voucher:cancelled', 'This voucher has been cancelled'));
      } else if (result.voucher?.claimed) {
        setError(t('voucher:alreadyClaimed', 'This voucher has already been claimed'));
      } else {
        const amount = result.voucher?.amount || '0';
        console.log('Setting voucher info with amount:', amount);
        
        setVoucherInfo({
          amount: amount,
          voucherId: result.voucher?.voucher_id,
          deadline: result.deadline,
          signature: result.signature,
          contract_address: result.contract_address
        });
      }
    } catch (err: any) {
      console.error('Verify error:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retry_after;
        if (retryAfter) {
          const minutes = Math.ceil(retryAfter / 60);
          setError(t('voucher:rateLimitError', 
            'Too many attempts. Please try again in {{minutes}} minutes.', 
            { minutes }
          ));
        } else {
          setError(t('voucher:rateLimitErrorGeneric', 'Too many attempts. Please try again later.'));
        }
      } else {
        setError(t('voucher:verifyError', 'Failed to verify voucher'));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!voucherId || !targetAddress) return;
    
    setIsClaiming(true);
    setError('');
    
    try {
      const result = await voucherAPI.claimVoucher({
        code: voucherId,
        password: password || undefined,
        recipient_address: targetAddress,
      });
      
      if (result.success || result.signature) {
        // API returned authorization - now claim on-chain
        console.log('Got claim authorization, executing on-chain...');
        
        try {
          // Execute the blockchain claim
          const claimResult = await claimVoucherOnChain(
            result.voucher_id,
            result.recipient,
            result.amount,
            result.deadline,
            result.signature
          );
          
          console.log('Blockchain claim result:', claimResult);
          
          // Update backend database with transaction hash
          if (claimResult.transactionHash) {
            try {
              await voucherAPI.updateClaimStatus(voucherId, claimResult.transactionHash, true);
              console.log('Backend database updated with transaction hash');
            } catch (statusError: any) {
              console.error('Failed to update claim status in backend:', statusError);
              // Don't fail the whole claim for this - just log it
            }
          }
          
          setClaimSuccess(true);
          setTxHash(claimResult.transactionHash || '');
          // Store claim info for display
          setVoucherInfo(prev => ({
            ...prev,
            claimSignature: result.signature,
            claimDeadline: result.deadline,
            actualVoucherId: result.voucher_id
          }));
        } catch (blockchainError: any) {
          console.error('Blockchain claim failed:', blockchainError);
          setError(t('voucher:blockchainClaimError', 
            'Claim authorization successful but blockchain transaction failed: {{error}}', 
            { error: blockchainError.message }
          ));
          return;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('voucher:claimError', 'Failed to claim voucher'));
    } finally {
      setIsClaiming(false);
    }
  };

  const copyAddress = () => {
    if (targetAddress) {
      navigator.clipboard.writeText(targetAddress);
    }
  };

  if (isVerifying) {
    return (
      <div className="voucher-claim-container">
        <div className="voucher-claim-card">
          <div className="loader"></div>
          <p>{t('voucher:verifying', 'Verifying voucher...')}</p>
        </div>
      </div>
    );
  }

  if (error && !voucherInfo) {
    return (
      <div className="voucher-claim-container">
        <div className="voucher-claim-card">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h2>{t('voucher:error', 'Error')}</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            {t('common.goHome', 'Go Home')}
          </button>
        </div>
      </div>
    );
  }

  if (claimSuccess) {
    return (
      <div className="voucher-claim-container">
        <div className="voucher-claim-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>{t('voucher:claimSuccess', 'Voucher Claimed Successfully!')}</h2>
          <p className="amount-display">
            {formatEther(BigInt(voucherInfo?.amount || '0'))} NBGN
          </p>
          <p className="success-message">
            {t('voucher:claimedTo', 'Tokens have been sent to {{address}}', { address: targetAddress })}
          </p>
          <p className="info-message">
            {t('voucher:claimNote', 'The voucher claim has been authorized. The tokens will be sent to your address shortly.')}
          </p>
          {txHash && (
            <a
              href={`https://arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ marginRight: '10px' }}
            >
              <i className="fas fa-external-link-alt"></i>
              {t('voucher:viewTransaction', 'View Transaction')}
            </a>
          )}
          <button onClick={() => navigate('/')} className="btn btn-primary">
            {t('common.goHome', 'Go Home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-claim-container">
      <div className="voucher-claim-card">
        <div className="voucher-icon">
          <i className="fas fa-gift"></i>
        </div>
        
        <h2>{t('voucher:claimTitle', 'Claim NBGN Voucher')}</h2>
        
        {voucherInfo && (
          <div className="voucher-info">
            <p className="amount-display">
              {formatEther(BigInt(voucherInfo.amount || '0'))} NBGN
            </p>
            {voucherInfo.deadline && (
              <p className="expires-info">
                {t('voucher:expiresAt', 'Expires: {{date}}', {
                  date: new Date(voucherInfo.deadline * 1000).toLocaleDateString()
                })}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleClaim} className="claim-form">
          {voucherInfo?.hasPassword && (
            <div className="form-group">
              <label>{t('voucher:password', 'Password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('voucher:passwordPlaceholder', 'Enter voucher password')}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>{t('voucher:recipientAddress', 'Recipient Address')}</label>
            {!isConnected ? (
              <div className="wallet-connect-section">
                <p>{t('voucher:connectWalletMsg', 'Connect your wallet or enter an address manually')}</p>
                {showConnectOptions ? (
                  <div className="connect-options">
                    {connectors.map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => connect({ connector })}
                        className="connect-button"
                      >
                        {connector.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConnectOptions(true)}
                    className="btn btn-secondary"
                  >
                    {t('voucher:connectWallet', 'Connect Wallet')}
                  </button>
                )}
                <div className="divider">{t('common.or', 'OR')}</div>
              </div>
            ) : (
              <div className="connected-address">
                <span>{targetAddress}</span>
                <button type="button" onClick={copyAddress} className="copy-button">
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            )}
            
            {!isConnected && (
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                pattern="^0x[a-fA-F0-9]{40}$"
                required
              />
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
            disabled={isClaiming || !targetAddress}
            className="btn btn-primary"
          >
            {isClaiming ? (
              <span>
                <i className="fas fa-spinner fa-spin"></i>
                {t('voucher:claiming', 'Claiming...')}
              </span>
            ) : (
              t('voucher:claimButton', 'Claim Voucher')
            )}
          </button>
        </form>

        <div className="help-section">
          <h3>{t('voucher:noWalletTitle', "Don't have a wallet?")}</h3>
          <p>{t('voucher:noWalletMsg', 'You can still claim by entering any Ethereum address above. The tokens will be sent there.')}</p>
          <p>{t('voucher:walletRecommendation', 'We recommend MetaMask for beginners:')}</p>
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="wallet-link">
            {t('voucher:getMetaMask', 'Get MetaMask')}
          </a>
        </div>
      </div>
    </div>
  );
};