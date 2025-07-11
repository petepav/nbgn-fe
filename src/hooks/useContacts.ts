import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

export interface Contact {
  id: string;
  address: string;
  nickname: string;
  avatar: string;
  createdAt: number;
  lastUsed?: number;
}

const CONTACTS_STORAGE_KEY = 'nbgn_contacts';

// Generate a random avatar URL using DiceBear API (free service)
const generateAvatar = (address: string): string => {
  const seed = address.toLowerCase();
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`;
};

// Alternative: Simple geometric avatars
const generateSimpleAvatar = (address: string): string => {
  const seed = address.toLowerCase();
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=00966F,D62612,ffffff`;
};

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  // Load contacts from localStorage
  const loadContacts = useCallback(() => {
    try {
      const stored = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (stored) {
        const parsedContacts = JSON.parse(stored);
        setContacts(parsedContacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  }, []);

  // Save contacts to localStorage
  const saveContacts = useCallback((contactList: Contact[]) => {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contactList));
      setContacts(contactList);
    } catch (error) {
      console.error('Failed to save contacts:', error);
      throw new Error('Failed to save contact');
    }
  }, []);

  // Add new contact
  const addContact = useCallback((address: string, nickname: string): Contact => {
    // Validate address
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    // Check if contact already exists
    const existingContact = contacts.find(c => c.address.toLowerCase() === address.toLowerCase());
    if (existingContact) {
      throw new Error('Contact already exists');
    }

    const newContact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address: address.toLowerCase(),
      nickname: nickname.trim(),
      avatar: generateAvatar(address),
      createdAt: Date.now()
    };

    const updatedContacts = [...contacts, newContact];
    saveContacts(updatedContacts);
    
    return newContact;
  }, [contacts, saveContacts]);

  // Update existing contact
  const updateContact = useCallback((contactId: string, updates: Partial<Pick<Contact, 'nickname' | 'avatar' | 'lastUsed'>>) => {
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) {
      throw new Error('Contact not found');
    }

    const updatedContacts = [...contacts];
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      ...updates
    };

    saveContacts(updatedContacts);
  }, [contacts, saveContacts]);

  // Delete contact
  const deleteContact = useCallback((contactId: string) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    saveContacts(updatedContacts);
  }, [contacts, saveContacts]);

  // Find contact by address
  const findContactByAddress = useCallback((address: string): Contact | undefined => {
    return contacts.find(c => c.address.toLowerCase() === address.toLowerCase());
  }, [contacts]);

  // Update last used timestamp
  const updateLastUsed = useCallback((contactId: string) => {
    updateContact(contactId, { lastUsed: Date.now() });
  }, [updateContact]);

  // Get recently used contacts
  const getRecentContacts = useCallback((limit: number = 5): Contact[] => {
    return contacts
      .filter(c => c.lastUsed)
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, limit);
  }, [contacts]);

  // Get all contacts sorted alphabetically
  const getAllContacts = useCallback((): Contact[] => {
    return [...contacts].sort((a, b) => a.nickname.localeCompare(b.nickname));
  }, [contacts]);

  // Search contacts
  const searchContacts = useCallback((query: string): Contact[] => {
    const lowercaseQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.nickname.toLowerCase().includes(lowercaseQuery) ||
      contact.address.toLowerCase().includes(lowercaseQuery)
    );
  }, [contacts]);

  // Import contacts from JSON
  const importContacts = useCallback((importedContacts: Omit<Contact, 'id' | 'createdAt'>[]) => {
    setLoading(true);
    try {
      const newContacts: Contact[] = importedContacts.map(contact => ({
        ...contact,
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        address: contact.address.toLowerCase(),
        avatar: contact.avatar || generateAvatar(contact.address)
      }));

      // Filter out duplicates
      const existingAddresses = new Set(contacts.map(c => c.address.toLowerCase()));
      const uniqueNewContacts = newContacts.filter(c => !existingAddresses.has(c.address));

      if (uniqueNewContacts.length === 0) {
        throw new Error('No new contacts to import');
      }

      const updatedContacts = [...contacts, ...uniqueNewContacts];
      saveContacts(updatedContacts);
      
      return uniqueNewContacts.length;
    } finally {
      setLoading(false);
    }
  }, [contacts, saveContacts]);

  // Export contacts to JSON
  const exportContacts = useCallback(() => {
    return JSON.stringify(contacts, null, 2);
  }, [contacts]);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return {
    contacts: getAllContacts(),
    recentContacts: getRecentContacts(),
    loading,
    addContact,
    updateContact,
    deleteContact,
    findContactByAddress,
    updateLastUsed,
    searchContacts,
    importContacts,
    exportContacts,
    refreshContacts: loadContacts
  };
};