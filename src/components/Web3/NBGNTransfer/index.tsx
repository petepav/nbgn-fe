import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNBGN } from '../../../hooks/useNBGN';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';

export const NBGNTransfer: React.FC = () => {
  const { t } = useTranslation();
  const { formattedBalance, rawBalance, transfer } = useNBGN();
  const { executeTransaction, status, hash, error } = useTransaction();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await executeTransaction(async () => {
        return await transfer(recipient, amount);
      });
      
      // Clear form on success
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Transfer failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxAmount = () => {
    setAmount(rawBalance);
  };

  return (
    <div className="nbgn-transfer">
      <h3 className="text-xl font-bold mb-4">{t('web3:transaction.send', 'Send NBGN')}</h3>
      
      <div className="balance-info mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">{t('common:balance', 'Available Balance')}</p>
        <p className="text-2xl font-bold">{formattedBalance}</p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('web3:recipient', 'Recipient Address')}
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('web3:amount', 'Amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={formattedBalance}
              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="button"
              onClick={maxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-green-600 hover:text-green-800"
            >
              MAX
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || status === 'pending' || !recipient || !amount}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || status === 'pending' 
            ? t('web3:transaction.pending') 
            : t('web3:transaction.send', 'Send NBGN')
          }
        </button>
      </form>

      <TransactionStatus status={status} hash={hash} error={error} />
    </div>
  );
};