import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNBGN } from '../../../hooks/useNBGN';
import { useTransaction } from '../../../hooks/useTransaction';
import { TransactionStatus } from '../TransactionStatus';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface NBGNTransferProps {
  initialRecipient?: string;
}

export const NBGNTransfer: React.FC<NBGNTransferProps> = ({
  initialRecipient = '',
}) => {
  const { t } = useTranslation();
  const { formattedBalance, rawBalance, transfer } = useNBGN();
  const { executeTransaction, status, hash, error } = useTransaction();

  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    setRecipient(initialRecipient);
  }, [initialRecipient]);

  // QR Scanner effect
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        'qr-scanner',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false
      );

      scanner.render(
        decodedText => {
          // Successfully scanned
          setRecipient(decodedText);
          setShowScanner(false);
          void scanner.clear();
        },
        () => {
          // Error scanning - ignore
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {
            // Ignore cleanup errors
          });
        }
      };
    }
  }, [showScanner]);

  const handleScannerClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {
        // Ignore cleanup errors
      });
    }
    setShowScanner(false);
  };

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
    } catch {
      // Error is handled by the transaction hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxAmount = () => {
    setAmount(rawBalance);
  };

  const adjustAmount = (delta: number) => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.max(0, currentAmount + delta);
    const maxBalance = parseFloat(rawBalance) || 0;

    if (newAmount <= maxBalance) {
      setAmount(newAmount.toFixed(2));
    } else {
      setAmount(maxBalance.toFixed(2));
    }
  };

  return (
    <div className="nbgn-transfer">
      <h3 className="text-xl font-bold mb-4">
        {t('web3:transaction.send', 'Send NBGN')}
      </h3>

      <div className="balance-info mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {t('common:balance', 'Available Balance')}
        </p>
        <p className="text-2xl font-bold">{formattedBalance}</p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('web3:recipient', 'Recipient Address')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              title="Scan QR Code"
            >
              <i className="fas fa-qrcode mr-1"></i>
              Scan
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('web3:amount', 'Amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
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

          {/* Amount Adjustment Buttons */}
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(-1)}
                className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                title="Subtract 1 NBGN"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-0.5)}
                className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                title="Subtract 0.5 NBGN"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(-0.05)}
                className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                title="Subtract 0.05 NBGN"
              >
                -0.05
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => adjustAmount(0.05)}
                className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                title="Add 0.05 NBGN"
              >
                +0.05
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(0.5)}
                className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                title="Add 0.5 NBGN"
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => adjustAmount(1)}
                className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                title="Add 1 NBGN"
              >
                +1
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting || status === 'pending' || !recipient || !amount
          }
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || status === 'pending'
            ? t('web3:transaction.pending')
            : t('web3:transaction.send', 'Send NBGN')}
        </button>
      </form>

      <TransactionStatus status={status} hash={hash} error={error} />

      {/* QR Scanner Modal */}
      {showScanner && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleScannerClose}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                <i className="fas fa-qrcode mr-2 text-blue-600"></i>
                Scan QR Code
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Point your camera at a QR code containing a wallet address
              </p>
            </div>

            <div
              id="qr-scanner"
              className="border rounded-lg overflow-hidden"
            ></div>

            <div className="mt-4 text-center">
              <button
                onClick={handleScannerClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
