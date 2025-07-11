import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContacts } from '../../hooks/useContacts';
import { ethers } from 'ethers';

interface AddContactModalProps {
  onClose: () => void;
  onContactAdded: () => void;
  initialAddress?: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  onClose,
  onContactAdded,
  initialAddress = ''
}) => {
  const { t } = useTranslation();
  const { addContact } = useContacts();
  
  const [address, setAddress] = useState(initialAddress);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!address.trim() || !nickname.trim()) {
      setError(t('contacts:fillAllFields', 'Please fill all fields'));
      return;
    }

    if (!ethers.isAddress(address.trim())) {
      setError(t('contacts:invalidAddress', 'Invalid Ethereum address'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addContact(address.trim(), nickname.trim());
      onContactAdded();
    } catch (err: any) {
      setError(err.message || t('contacts:addError', 'Failed to add contact'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            {t('contacts:addNew', 'Add New Contact')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="fas fa-times text-gray-500"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('contacts:nickname', 'Nickname')}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('contacts:nicknamePlaceholder', 'Enter a friendly name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('contacts:address', 'Ethereum Address')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common:cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting 
                ? t('common:adding', 'Adding...') 
                : t('contacts:add', 'Add Contact')
              }
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {t('contacts:storageNote', 'Contacts are stored locally on your device')}
          </p>
        </div>
      </div>
    </div>
  );
};