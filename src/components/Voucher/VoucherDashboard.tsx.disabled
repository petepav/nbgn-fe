import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { voucherAPI, UserVoucher } from '../../services/voucherAPI';
import { cancelVoucherOnChain } from '../../services/voucherContract';
import './VoucherDashboard.css';

export const VoucherDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { address } = useAccount();
  
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Utility functions
  const formatNBGN = (weiAmount: string) => {
    try {
      return formatEther(BigInt(weiAmount));
    } catch {
      return weiAmount; // Fallback if already formatted
    }
  };

  const formatDate = (timestamp: number | string) => {
    let date: Date;
    
    // Handle different timestamp formats
    if (typeof timestamp === 'string') {
      // Try parsing as ISO string first
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // If failed, try parsing as numeric string
        const numericTimestamp = Number(timestamp);
        if (!isNaN(numericTimestamp)) {
          // Check if it's in seconds (Unix timestamp) or milliseconds
          date = new Date(numericTimestamp < 10000000000 ? numericTimestamp * 1000 : numericTimestamp);
        } else {
          return 'Invalid Date';
        }
      }
    } else {
      // Numeric timestamp - check if seconds or milliseconds
      date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (address) {
      loadVouchers();
    }
  }, [address]);

  const loadVouchers = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await voucherAPI.getUserVouchers(address);
      console.log('API Response for address', address, ':', result); // Debug log
      console.log('Response type:', typeof result);
      console.log('Is array?', Array.isArray(result));
      console.log('Response data:', JSON.stringify(result, null, 2));
      
      // Ensure result is an array
      let vouchersArray: any[] = [];
      
      if (Array.isArray(result)) {
        console.log('Setting vouchers from array, first item:', result[0]);
        vouchersArray = result;
      } else if (result && typeof result === 'object' && 'vouchers' in result && Array.isArray((result as any).vouchers)) {
        // Handle case where API returns { vouchers: [...] }
        console.log('Setting vouchers from object.vouchers, first item:', (result as any).vouchers[0]);
        vouchersArray = (result as any).vouchers;
      } else {
        console.error('Unexpected API response format:', result);
        setVouchers([]);
        return;
      }
      
      // Map API response fields to expected interface
      const mappedVouchers = vouchersArray.map(v => {
        console.log('Raw voucher from API:', v);
        console.log('Available fields:', Object.keys(v));
        
        // Try to find the shareable link or code
        let shareableLink = v.shareableLink || v.shareable_link || v.link || v.shareable_code || v.code || '';
        
        // If we have a code but no link, build the link
        const code = v.shareable_code || v.code || v.voucher_code;
        if (!shareableLink && code) {
          shareableLink = `${window.location.origin}/#/claim/${code}`;
        }
        
        // If we still don't have a link, try to build from voucher ID or code
        const voucherId = v.voucherId || v.voucher_id || v.id || v._id;
        const shareCode = code || voucherId;
        if (!shareableLink && shareCode) {
          console.log('Building link from code/ID:', shareCode);
          shareableLink = `${window.location.origin}/#/claim/${shareCode}`;
        }
        
        // Ensure shareableLink is a full URL
        if (shareableLink && !shareableLink.startsWith('http://') && !shareableLink.startsWith('https://')) {
          // Check if it's just a code (no slashes) or a path
          if (!shareableLink.includes('/')) {
            // It's just a code, build the full claim URL
            shareableLink = `${window.location.origin}/#/claim/${shareableLink}`;
          } else if (shareableLink.startsWith('/') && !shareableLink.includes('/claim/')) {
            // It's a path like /CACIB3WUCRH3CBE6, extract the code and build claim URL
            const codeFromPath = shareableLink.substring(1); // Remove leading slash
            shareableLink = `${window.location.origin}/#/claim/${codeFromPath}`;
          } else if (shareableLink.includes('/claim/')) {
            // It contains /claim/, make sure to add the hash
            const claimMatch = shareableLink.match(/\/claim\/([^/?]+)/);
            if (claimMatch) {
              const code = claimMatch[1];
              shareableLink = `${window.location.origin}/#/claim/${code}`;
            } else {
              // Fallback - prepend with hash
              shareableLink = `${window.location.origin}/#${shareableLink}`;
            }
          } else {
            // Unknown format, just prepend origin with hash
            shareableLink = `${window.location.origin}/#${shareableLink}`;
          }
        }
        
        const createdAt = v.createdAt || v.created_at || v.timestamp || v.created;
        
        console.log('Link field values:', {
          shareableLink: v.shareableLink,
          shareable_link: v.shareable_link,
          link: v.link,
          shareable_code: v.shareable_code,
          code: v.code,
          voucher_code: v.voucher_code,
          finalLink: shareableLink
        });
        
        return {
          voucherId,
          amount: v.amount,
          createdAt,
          expiresAt: v.expiresAt || v.expires_at || v.expires,
          claimed: v.claimed,
          claimedBy: v.claimedBy || v.claimed_by,
          claimedAt: v.claimedAt || v.claimed_at,
          shareableLink,
        };
      });
      
      console.log('Mapped vouchers:', mappedVouchers);
      setVouchers(mappedVouchers);
    } catch (err) {
      console.error('Error loading vouchers:', err);
      setError(t('voucher:loadError', 'Failed to load vouchers'));
      setVouchers([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const shareVoucher = async (voucher: UserVoucher) => {
    try {
      if (!voucher.shareableLink) {
        console.error('No shareable link available');
        return;
      }
      
      await navigator.share({
        title: t('voucher:shareTitle', 'NBGN Voucher'),
        text: t('voucher:shareText', 'I sent you {{amount}} NBGN!', { amount: formatNBGN(voucher.amount) }),
        url: voucher.shareableLink,
      });
    } catch (error: any) {
      // User canceled share or error occurred
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  const copyLink = async (voucher: UserVoucher) => {
    console.log('copyLink called with voucher:', voucher);
    console.log('shareableLink:', voucher.shareableLink);
    
    try {
      if (!voucher.shareableLink) {
        console.error('No shareable link available');
        alert('No link available to copy');
        return;
      }
      
      // Use the fallback method directly since clipboard API seems problematic
      const textArea = document.createElement('textarea');
      textArea.value = voucher.shareableLink;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          console.log('Successfully copied:', voucher.shareableLink);
          setCopiedId(voucher.voucherId);
          setTimeout(() => setCopiedId(null), 2000);
        } else {
          console.error('Copy command returned false');
        }
      } catch (err) {
        console.error('Copy failed:', err);
        alert('Failed to copy link');
      }
      
      document.body.removeChild(textArea);
    } catch (error) {
      console.error('Unexpected error in copyLink:', error);
      alert('Failed to copy link');
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    console.log('handleDeleteVoucher called with:', voucherId);
    
    const confirmMessage = t('voucher:deleteConfirm', 'Are you sure you want to delete this voucher from the list? (This only removes it from display, it does not affect the blockchain)');
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      await voucherAPI.deleteVoucher(voucherId);
      
      // Refresh voucher list
      await loadVouchers();
      
      const successMessage = t('voucher:deleteSuccess', 'Voucher removed from list.');
      alert(successMessage);
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(t('voucher:deleteError', 'Failed to delete voucher: {{error}}', { error: error.message }));
    }
  };

  const handleCancelVoucher = async (voucherId: string, amount: string) => {
    console.log('handleCancelVoucher called with:', { voucherId, amount });
    
    // First confirmation - general warning
    const confirmMessage = t('voucher:cancelConfirm', 'Are you sure you want to cancel this voucher?');
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    // Second confirmation - specific warning about funds
    const warningMessage = t('voucher:cancelWarning', 
      `WARNING: This will attempt to reclaim ${formatNBGN(amount)} NBGN from the voucher.\n\n` +
      `If the voucher has already been claimed or if there's an error, the funds might be lost!\n\n` +
      `Are you absolutely sure you want to proceed?`,
      { amount: formatNBGN(amount) }
    );
    
    if (!window.confirm(warningMessage)) {
      return;
    }
    
    try {
      console.log('Attempting to cancel voucher:', voucherId);
      await cancelVoucherOnChain(voucherId);
      
      // Sync with backend
      try {
        console.log('Syncing voucher with backend...');
        await voucherAPI.syncVoucher(voucherId);
        console.log('Backend sync successful');
        
        // Give backend a moment to update its database
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (syncError) {
        console.error('Backend sync failed:', syncError);
        // Continue anyway - the on-chain state is what matters
      }
      
      // Refresh voucher list
      console.log('Refreshing voucher list...');
      await loadVouchers();
      
      const successMessage = t('voucher:cancelSuccess', 'Voucher cancelled successfully! NBGN returned to your wallet.');
      alert(successMessage);
    } catch (error: any) {
      console.error('Cancel failed:', error);
      
      // Provide option to remove from UI anyway
      const removeAnywayMessage = t('voucher:cancelErrorRemove', 
        `Failed to cancel voucher on blockchain: ${error.message}\n\n` +
        `Do you want to remove it from your list anyway? (The NBGN might be lost)`,
        { error: error.message }
      );
      
      if (window.confirm(removeAnywayMessage)) {
        // Filter out the voucher from the list
        setVouchers(prevVouchers => prevVouchers.filter(v => v.voucherId !== voucherId));
      }
    }
  };

  const getStatusBadge = (voucher: UserVoucher) => {
    if (voucher.claimed) {
      return (
        <span className="status-badge claimed">
          <i className="fas fa-check"></i>
          {t('voucher:claimed', 'Claimed')}
        </span>
      );
    }
    
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return (
        <span className="status-badge expired">
          <i className="fas fa-clock"></i>
          {t('voucher:expired', 'Expired')}
        </span>
      );
    }
    
    return (
      <span className="status-badge active">
        <i className="fas fa-gift"></i>
        {t('voucher:active', 'Active')}
      </span>
    );
  };

  if (!address) {
    return (
      <div className="voucher-dashboard">
        <div className="connect-message">
          <i className="fas fa-wallet"></i>
          <p>{t('voucher:connectToView', 'Connect your wallet to view vouchers')}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="voucher-dashboard">
        <div className="loading">
          <div className="loader"></div>
          <p>{t('voucher:loading', 'Loading vouchers...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-dashboard">
      <div className="dashboard-header">
        <h3>{t('voucher:myVouchers', 'My Vouchers')}</h3>
        <button onClick={loadVouchers} className="refresh-btn">
          <i className="fas fa-sync"></i>
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {!vouchers || vouchers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>{t('voucher:noVouchers', 'No vouchers yet')}</p>
          <p className="sub-text">
            {t('voucher:createFirst', 'Create your first voucher above!')}
          </p>
        </div>
      ) : (
        <div className="voucher-list">
          {vouchers && vouchers.map((voucher, index) => (
            <div key={`voucher-${voucher.voucherId || index}`} className="voucher-item">
              <div className="voucher-header">
                <span className="amount">{formatNBGN(voucher.amount)} NBGN</span>
                {getStatusBadge(voucher)}
              </div>
              
              <div className="voucher-info">
                <p className="date">
                  {t('voucher:created', 'Created')}: {formatDate(voucher.createdAt)}
                </p>
                
                {voucher.expiresAt && (
                  <p className="date">
                    {t('voucher:expires', 'Expires')}: {formatDate(voucher.expiresAt)}
                  </p>
                )}
                
                {voucher.claimed && voucher.claimedBy && (
                  <p className="claimed-info">
                    {t('voucher:claimedBy', 'Claimed by')}: {voucher.claimedBy.slice(0, 6)}...{voucher.claimedBy.slice(-4)}
                  </p>
                )}
              </div>

              <div className="voucher-actions">
                {!voucher.claimed && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date()) && (
                  <>
                  <button
                    onClick={() => copyLink(voucher)}
                    className="action-btn"
                  >
                    {copiedId === voucher.voucherId ? (
                      <><i className="fas fa-check"></i> {t('common.copied', 'Copied!')}</>
                    ) : (
                      <><i className="fas fa-copy"></i> {t('voucher:copyLink', 'Copy Link')}</>
                    )}
                  </button>
                  
                  {'share' in navigator && (
                    <button
                      onClick={() => shareVoucher(voucher)}
                      className="action-btn"
                    >
                      <i className="fas fa-share"></i> {t('common.share', 'Share')}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleCancelVoucher(voucher.voucherId, voucher.amount)}
                    className="action-btn cancel-btn"
                  >
                    <i className="fas fa-times-circle"></i> {t('voucher:cancel', 'Cancel & Reclaim')}
                  </button>
                  </>
                )}
                
                <button
                  onClick={() => handleDeleteVoucher(voucher.voucherId)}
                  className="action-btn delete-btn"
                  title={t('voucher:deleteTooltip', 'Remove from list only')}
                >
                  <i className="fas fa-trash"></i> {t('voucher:delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};