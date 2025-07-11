import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  status: string;
  hash: string | null;
  error: string | null;
}

export const TransactionStatus: React.FC<Props> = ({ status, hash, error }) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'submitted': return '#1E90FF';
      case 'confirmed': return '#32CD32';
      case 'failed': return '#DC143C';
      default: return '#808080';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="transaction-status" style={{ color: getStatusColor() }}>
      <p>{t(`transaction.${status}`)}</p>
      {hash && (
        <a 
          href={`https://etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Etherscan
        </a>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
};