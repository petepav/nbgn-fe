// Wallet connection persistence utilities

const WALLET_CONNECTION_KEY = 'nbgn_wallet_connection';
const CONNECTION_TIMESTAMP_KEY = 'nbgn_connection_timestamp';

export interface WalletConnectionData {
  wasConnected: boolean;
  lastProvider?: string;
  timestamp: number;
}

export const saveWalletConnection = (provider?: string): void => {
  try {
    const connectionData: WalletConnectionData = {
      wasConnected: true,
      lastProvider: provider,
      timestamp: Date.now()
    };
    
    // eslint-disable-next-line no-undef
    localStorage.setItem(WALLET_CONNECTION_KEY, JSON.stringify(connectionData));
    // eslint-disable-next-line no-undef
    localStorage.setItem(CONNECTION_TIMESTAMP_KEY, connectionData.timestamp.toString());
  } catch (error) {
    // Silent fail for localStorage errors (private browsing, etc.)
    // eslint-disable-next-line no-console, no-undef
    console.warn('Failed to save wallet connection state:', error);
  }
};

export const getWalletConnection = (): WalletConnectionData | null => {
  try {
    // eslint-disable-next-line no-undef
    const stored = localStorage.getItem(WALLET_CONNECTION_KEY);
    if (!stored) {
      return null;
    }

    const connectionData: WalletConnectionData = JSON.parse(stored);
    
    // Check if connection is not too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const isExpired = Date.now() - connectionData.timestamp > maxAge;
    
    if (isExpired) {
      clearWalletConnection();
      return null;
    }

    return connectionData;
  } catch (error) {
    // If parsing fails or localStorage errors, return null
    // eslint-disable-next-line no-console, no-undef
    console.warn('Failed to retrieve wallet connection state:', error);
    return null;
  }
};

export const clearWalletConnection = (): void => {
  try {
    // eslint-disable-next-line no-undef
    localStorage.removeItem(WALLET_CONNECTION_KEY);
    // eslint-disable-next-line no-undef
    localStorage.removeItem(CONNECTION_TIMESTAMP_KEY);
  } catch (error) {
    // Silent fail for localStorage errors
    // eslint-disable-next-line no-console, no-undef
    console.warn('Failed to clear wallet connection state:', error);
  }
};

export const shouldAutoReconnect = (): boolean => {
  const connectionData = getWalletConnection();
  return connectionData?.wasConnected === true;
};