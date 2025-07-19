export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  pegAsset: string;
  pegRate: number;
  color: string;
  stableToken: string;
  stableTokenAddress: string;
  stableTokenSymbol: string;
  chainId: number;
  chainName: string;
  hasTransferFee?: boolean;
  transferFeeRate?: number; // in basis points (20 = 0.02%)
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  NBGN: {
    address: '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067',
    symbol: 'NBGN',
    name: 'NBGN Token',
    decimals: 18,
    icon: '/assets/icons/nbgn.svg',
    pegAsset: 'EUR',
    pegRate: 1,
    color: '#1E88E5',
    stableToken: 'EURe',
    stableTokenAddress: '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
    stableTokenSymbol: 'EURe',
    chainId: 42161, // Arbitrum One
    chainName: 'Arbitrum One',
  },
  DBGN: {
    address: '0x4922fafB060C89E0B1A22339f3e52dA4f6e0f980',
    symbol: 'DBGN',
    name: 'DBGN Token',
    decimals: 18,
    icon: '/assets/icons/dbgn.svg',
    pegAsset: 'USDC (= USD)',
    pegRate: 0.6,
    color: '#43A047',
    stableToken: 'USDC',
    stableTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum One
    stableTokenSymbol: 'USDC',
    chainId: 42161, // Arbitrum One
    chainName: 'Arbitrum One',
  },
  GBGN: {
    address: '0x0000000000000000000000000000000000000000', // TODO: Add deployed GBGN contract address
    symbol: 'GBGN',
    name: 'Gold Backed Good Night',
    decimals: 18,
    icon: '/assets/icons/gbgn.svg',
    pegAsset: 'PAXG',
    pegRate: 5600,
    color: '#FFD700',
    stableToken: 'PAXG',
    stableTokenAddress: '0x45804880De22913dAFE09f4980848ECE6EcbAf78', // PAXG on Ethereum
    stableTokenSymbol: 'PAXG',
    chainId: 1, // Ethereum Mainnet
    chainName: 'Ethereum',
    hasTransferFee: true,
    transferFeeRate: 20, // 0.02% = 20 basis points
  },
};

export const DEFAULT_TOKEN = 'NBGN';

// Helper function to get exchange rate
export const getExchangeRate = (tokenSymbol: string): number => {
  const token =
    tokenSymbol === 'NBGN'
      ? SUPPORTED_TOKENS.NBGN
      : tokenSymbol === 'DBGN'
        ? SUPPORTED_TOKENS.DBGN
        : tokenSymbol === 'GBGN'
          ? SUPPORTED_TOKENS.GBGN
          : null;
  if (!token) return 1;

  // For NBGN: 1 EUR = 1.95583 NBGN
  if (tokenSymbol === 'NBGN') return 1.95583;

  // For DBGN: 1 USDC = 1.666... DBGN (1 / 0.60)
  if (tokenSymbol === 'DBGN') return 1 / token.pegRate;

  // For GBGN: 1 PAXG = 5600 GBGN
  if (tokenSymbol === 'GBGN') return token.pegRate;

  return 1;
};

// Helper function to calculate mint amount with fees
export const calculateMintAmount = (
  stableAmount: string,
  tokenSymbol: string
): string => {
  const amount = parseFloat(stableAmount);
  if (isNaN(amount) || amount <= 0) return '0';

  const token =
    tokenSymbol === 'NBGN'
      ? SUPPORTED_TOKENS.NBGN
      : tokenSymbol === 'DBGN'
        ? SUPPORTED_TOKENS.DBGN
        : tokenSymbol === 'GBGN'
          ? SUPPORTED_TOKENS.GBGN
          : null;
  if (!token) return '0';

  let effectiveAmount = amount;

  // Account for transfer fees if applicable
  if (token.hasTransferFee && token.transferFeeRate) {
    const feeRate = token.transferFeeRate / 1000000; // Convert basis points to decimal
    effectiveAmount = amount * (1 - feeRate);
  }

  const exchangeRate = getExchangeRate(tokenSymbol);
  return (effectiveAmount * exchangeRate).toFixed(6);
};

// Helper function to calculate burn amount with fees
export const calculateBurnAmount = (
  tokenAmount: string,
  tokenSymbol: string
): string => {
  const amount = parseFloat(tokenAmount);
  if (isNaN(amount) || amount <= 0) return '0';

  const token =
    tokenSymbol === 'NBGN'
      ? SUPPORTED_TOKENS.NBGN
      : tokenSymbol === 'DBGN'
        ? SUPPORTED_TOKENS.DBGN
        : tokenSymbol === 'GBGN'
          ? SUPPORTED_TOKENS.GBGN
          : null;
  if (!token) return '0';

  const exchangeRate = getExchangeRate(tokenSymbol);
  let stableAmount = amount / exchangeRate;

  // Account for transfer fees if applicable
  if (token.hasTransferFee && token.transferFeeRate) {
    const feeRate = token.transferFeeRate / 1000000;
    stableAmount = stableAmount * (1 - feeRate);
  }

  return stableAmount.toFixed(6);
};
