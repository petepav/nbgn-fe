import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContacts } from '../../hooks/useContacts';
import { AddContactModal } from './AddContactModal';

export const ContactsList: React.FC = () => {
  const { t } = useTranslation();
  const { 
    contacts, 
    recentContacts, 
    deleteContact, 
    updateLastUsed,
    searchContacts 
  } = useContacts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const displayedContacts = searchQuery ? searchContacts(searchQuery) : contacts;

  const handleSelectContact = (contactId: string, address: string) => {
    setSelectedContact(address);
    updateLastUsed(contactId);
    // Emit custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('contactSelected', { 
      detail: { address, contactId } 
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDeleteContact = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('common:confirm', 'Are you sure?'))) {
      deleteContact(contactId);
    }
  };

  return (
    <div className="contacts-list">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('contacts:title', 'Contacts')}</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          {t('contacts:add', 'Add Contact')}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('contacts:search', 'Search contacts...')}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      {/* Recent Contacts */}
      {!searchQuery && recentContacts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            {t('contacts:recent', 'Recent')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact.id, contact.address)}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img
                  src={contact.avatar}
                  alt={contact.nickname}
                  className="w-12 h-12 rounded-full mb-2"
                  onError={(e) => {
                    // Fallback to initials if image fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-sm font-medium truncate w-full text-center">
                  {contact.nickname}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Contacts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          {searchQuery ? t('contacts:searchResults', 'Search Results') : t('contacts:all', 'All Contacts')}
        </h3>
        
        {displayedContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <div>
                <i className="fas fa-search text-3xl mb-3"></i>
                <p>{t('contacts:noResults', 'No contacts found')}</p>
              </div>
            ) : (
              <div>
                <i className="fas fa-users text-3xl mb-3"></i>
                <p>{t('contacts:empty', 'No contacts yet')}</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-green-600 hover:text-green-700 font-medium"
                >
                  {t('contacts:addFirst', 'Add your first contact')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-green-300 hover:bg-green-50 ${
                  selectedContact === contact.address
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
                onClick={() => handleSelectContact(contact.id, contact.address)}
              >
                <img
                  src={contact.avatar}
                  alt={contact.nickname}
                  className="w-12 h-12 rounded-full mr-4"
                  onError={(e) => {
                    // Fallback to colored circle with initials
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-12 h-12 rounded-full mr-4 bg-green-600 flex items-center justify-center text-white font-bold';
                    fallback.textContent = contact.nickname.charAt(0).toUpperCase();
                    target.parentNode?.insertBefore(fallback, target);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {contact.nickname}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">
                    {formatAddress(contact.address)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {contact.lastUsed && (
                    <span className="text-xs text-gray-400">
                      {new Date(contact.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteContact(contact.id, e)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('common:delete', 'Delete')}
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onContactAdded={() => {
            setShowAddModal(false);
            // Optionally refresh or show success message
          }}
        />
      )}
    </div>
  );
};