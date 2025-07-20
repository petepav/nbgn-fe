import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';
import './TransactionStatus.css';

interface TransactionStatusProps {
  hash?: string;
  onClose?: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ hash, onClose }) => {
  const { t } = useTranslation();
  const status = useTransactionStatus(hash);

  if (!hash || !status) return null;

  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return <i className="fas fa-spinner fa-spin"></i>;
      case 'success':
        return <i className="fas fa-check-circle"></i>;
      case 'failed':
        return <i className="fas fa-times-circle"></i>;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'pending':
        return t('transaction.pending', 'Transaction pending...');
      case 'success':
        return t('transaction.success', 'Transaction successful!');
      case 'failed':
        return t('transaction.failed', 'Transaction failed');
    }
  };

  const getStatusClass = () => {
    return `transaction-status ${status.status}`;
  };

  return (
    <div className={getStatusClass()}>
      <div className="status-content">
        <div className="status-icon">{getStatusIcon()}</div>
        <div className="status-info">
          <p className="status-text">{getStatusText()}</p>
          {status.confirmations > 0 && (
            <p className="confirmations">
              {t('transaction.confirmations', '{{count}} confirmations', { count: status.confirmations })}
            </p>
          )}
          <a
            href={`https://arbiscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            {t('transaction.viewOnExplorer', 'View on Arbiscan')}
          </a>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="close-btn" aria-label={t('common.close', 'Close')}>
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};