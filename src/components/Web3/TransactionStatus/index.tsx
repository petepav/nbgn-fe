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
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        {status === 'pending' && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
        )}
        <div className="flex-1">
          <p className="text-yellow-800 font-medium" style={{ color: getStatusColor() }}>
            {t(`transaction.${status}`)}
          </p>
          {hash && (
            <a 
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-600 hover:text-yellow-700 text-sm underline mt-1 inline-block"
            >
              View on Etherscan
            </a>
          )}
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
};