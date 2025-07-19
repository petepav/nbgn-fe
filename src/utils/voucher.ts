import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

export interface VoucherData {
  privateKey: string;
  address: string;
  amount: string;
  token: string;
  createdAt: number;
  expiresAt?: number;
  creatorAddress: string;
}

export interface EncryptedVoucher {
  data: string;
  salt: string;
  iv: string;
}

// Generate a new wallet for the voucher
export const generateVoucherWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

// Encrypt voucher data with password
export const encryptVoucher = (
  voucherData: VoucherData,
  password: string
): EncryptedVoucher => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
  const iv = CryptoJS.lib.WordArray.random(128 / 8).toString();

  // Derive key from password using PBKDF2
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  // Encrypt the voucher data
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(voucherData), key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    data: encrypted.toString(),
    salt: salt,
    iv: iv,
  };
};

// Decrypt voucher data with password
export const decryptVoucher = (
  encryptedVoucher: EncryptedVoucher,
  password: string
): VoucherData | null => {
  try {
    // Derive key from password
    const key = CryptoJS.PBKDF2(password, encryptedVoucher.salt, {
      keySize: 256 / 32,
      iterations: 10000,
    });

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedVoucher.data, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedVoucher.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText) as VoucherData;
  } catch (error) {
    console.error('Failed to decrypt voucher:', error);
    return null;
  }
};

// Create shareable voucher link
export const createVoucherLink = (
  encryptedVoucher: EncryptedVoucher
): string => {
  const baseUrl = window.location.origin;
  const voucherParam = window.btoa(JSON.stringify(encryptedVoucher));
  return `${baseUrl}/#/voucher/${voucherParam}`;
};

// Parse voucher from link
export const parseVoucherFromLink = (
  voucherParam: string
): EncryptedVoucher | null => {
  try {
    const decoded = window.atob(voucherParam);
    return JSON.parse(decoded) as EncryptedVoucher;
  } catch (error) {
    console.error('Failed to parse voucher:', error);
    return null;
  }
};

// Validate voucher expiration
export const isVoucherExpired = (voucherData: VoucherData): boolean => {
  if (!voucherData.expiresAt) return false;
  return Date.now() > voucherData.expiresAt;
};
