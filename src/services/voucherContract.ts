import { parseEther, keccak256, toHex, encodePacked, decodeEventLog } from 'viem';
import { arbitrum } from 'wagmi/chains';
import { getPublicClient, getWalletClient } from '@wagmi/core';
import { config } from '../config/wagmi';

// Contract addresses
export const NBGN_VOUCHER_CONTRACT = '0x66Eb0Aa46827e5F3fFcb6Dea23C309CB401690B6';
export const NBGN_TOKEN_ADDRESS = '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067';

// Simplified ABI - only what we need
const VOUCHER_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "voucherId",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "createVoucher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "voucherId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "claimVoucher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "backendSigner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "voucherId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "VoucherCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "voucherId",
        "type": "bytes32"
      }
    ],
    "name": "cancelVoucher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const NBGN_TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const generateVoucherId = (): `0x${string}` => {
  // Generate voucher ID using keccak256 of timestamp + random
  const data = encodePacked(
    ['uint256', 'uint256'],
    [BigInt(Date.now()), BigInt(Math.floor(Math.random() * 1000000))]
  );
  return keccak256(data);
};

export const createVoucherOnChain = async (voucherId: string, amount: string) => {
  const walletClient = await getWalletClient(config);
  const publicClient = getPublicClient(config);
  
  if (!walletClient || !publicClient) {
    throw new Error('Wallet not connected');
  }
  
  const amountInWei = parseEther(amount);
  const account = walletClient.account;
  
  if (!account) {
    throw new Error('No account found');
  }
  
  // First approve the voucher contract to spend NBGN tokens
  const { request: approveRequest } = await publicClient.simulateContract({
    address: NBGN_TOKEN_ADDRESS,
    abi: NBGN_TOKEN_ABI,
    functionName: 'approve',
    args: [NBGN_VOUCHER_CONTRACT, amountInWei],
    account,
  });
  
  const approveTxHash = await walletClient.writeContract(approveRequest);
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  
  // Then create the voucher
  const { request: createRequest } = await publicClient.simulateContract({
    address: NBGN_VOUCHER_CONTRACT,
    abi: VOUCHER_CONTRACT_ABI,
    functionName: 'createVoucher',
    args: [voucherId as `0x${string}`, amountInWei],
    account,
  });
  
  const createTxHash = await walletClient.writeContract(createRequest);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: createTxHash });
  
  // Extract voucher ID from the VoucherCreated event
  let emittedVoucherId = voucherId;
  for (const log of receipt.logs) {
    try {
      const decodedLog = decodeEventLog({
        abi: VOUCHER_CONTRACT_ABI,
        data: log.data,
        topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
      });
      
      if (decodedLog.eventName === 'VoucherCreated') {
        emittedVoucherId = decodedLog.args.voucherId;
        break;
      }
    } catch {
      // Not our event, continue
    }
  }
  
  return {
    transactionHash: receipt.transactionHash,
    voucherId: emittedVoucherId,
  };
};

// Debug function to verify backend wallet matches contract signer
export const debugBackendWalletMatch = async () => {
  const { voucherAPI } = await import('./voucherAPI');
  const publicClient = getPublicClient(config);
  
  if (!publicClient) {
    throw new Error('Public client not available');
  }
  
  try {
    console.log('🔍 Debugging backend wallet vs contract signer...');
    
    // 1. Get backend wallet address
    const backendWallet = await voucherAPI.getBackendWallet();
    console.log('Backend wallet:', backendWallet.wallet_address);
    
    // 2. Get contract's expected backend signer
    const contractSigner = await publicClient.readContract({
      address: NBGN_VOUCHER_CONTRACT as `0x${string}`,
      abi: VOUCHER_CONTRACT_ABI,
      functionName: 'backendSigner',
    });
    console.log('Contract expects:', contractSigner);
    
    // 3. Compare addresses
    const match = contractSigner.toLowerCase() === backendWallet.wallet_address.toLowerCase();
    console.log('🔗 Addresses match:', match);
    
    if (!match) {
      console.error('❌ MISMATCH! This is why claims are failing.');
      console.error('Contract expects:', contractSigner);
      console.error('Backend provides:', backendWallet.wallet_address);
      console.error('👉 Jenny needs to call updateBackendSigner() with the correct address');
    } else {
      console.log('✅ Addresses match! Signature verification should work.');
    }
    
    return {
      match,
      contractSigner,
      backendWallet: backendWallet.wallet_address,
      message: match ? 'Addresses match!' : 'Address mismatch - this is why claims fail!'
    };
  } catch (error: any) {
    console.error('Debug failed:', error);
    throw error;
  }
};

// Test function with Jenny's exact parameters
export const testClaimWithJennysParams = async () => {
  const testClaim = {
    voucherId: "0xadeea4c8e0c60f95c97fe102e11d8b1c5d1ddd9d58bbd63f65e45abbc0e3f98b",
    recipient: "0x742d35cc6634c0532925a3b844bc9e7595f8fa8e",
    deadline: 1753038976,
    signature: "0xc66aed8e7aef82891d5304c9ec80aceb53b39ef01def404a080c4ac22b2793d17892c6044145cbfc0ff36cfa31d26dc965ec75957ea1cebe45f1f9e79888446c1b"
  };

  const publicClient = getPublicClient(config);
  
  if (!publicClient) {
    throw new Error('Public client not available');
  }
  
  try {
    console.log('Testing with Jenny\'s exact parameters:', testClaim);
    
    // Simulate first
    const { request } = await publicClient.simulateContract({
      address: NBGN_VOUCHER_CONTRACT as `0x${string}`,
      abi: VOUCHER_CONTRACT_ABI,
      functionName: 'claimVoucher',
      args: [
        testClaim.voucherId as `0x${string}`,
        testClaim.recipient as `0x${string}`,
        BigInt(testClaim.deadline),
        testClaim.signature as `0x${string}`
      ],
    });
    
    console.log('✅ Test simulation successful!');
    return { success: true, message: 'Jenny\'s test parameters work!' };
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

export const claimVoucherOnChain = async (
  voucherId: string,
  recipient: string,
  amount: string,
  deadline: number,
  signature: string
) => {
  const publicClient = getPublicClient(config);
  const walletClient = await getWalletClient(config);
  
  if (!publicClient) {
    throw new Error('Public client not available');
  }
  
  if (!walletClient) {
    throw new Error('Wallet not connected for transaction execution');
  }
  
  try {
    console.log('Claiming voucher on-chain:', { voucherId, recipient, amount, deadline });
    
    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
      address: NBGN_VOUCHER_CONTRACT as `0x${string}`,
      abi: VOUCHER_CONTRACT_ABI,
      functionName: 'claimVoucher',
      args: [
        voucherId as `0x${string}`,
        recipient as `0x${string}`,
        BigInt(deadline),
        signature as `0x${string}`
      ],
    });
    
    console.log('Claim simulation successful, executing transaction...');
    
    // Execute the actual transaction
    const txHash = await walletClient.writeContract(request);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    console.log('Claim transaction confirmed:', receipt.transactionHash);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      message: 'Voucher claimed successfully'
    };
  } catch (error: any) {
    console.error('Claim transaction failed:', error);
    throw new Error(error.shortMessage || error.message || 'Failed to claim voucher');
  }
};

export const cancelVoucherOnChain = async (voucherId: string) => {
  if (!voucherId) {
    throw new Error('Voucher ID is required');
  }
  
  const walletClient = await getWalletClient(config);
  const publicClient = getPublicClient(config);
  
  if (!walletClient || !publicClient) {
    throw new Error('Wallet not connected');
  }
  
  const account = walletClient.account;
  
  if (!account) {
    throw new Error('No account found');
  }
  
  console.log('Cancelling voucher with ID:', voucherId);
  
  // Ensure voucherId is properly formatted as bytes32
  let formattedVoucherId: `0x${string}`;
  if (voucherId.startsWith('0x')) {
    // Pad to 32 bytes if needed
    formattedVoucherId = (voucherId.padEnd(66, '0') as `0x${string}`);
  } else {
    // Add 0x prefix and pad
    formattedVoucherId = ('0x' + voucherId.padEnd(64, '0') as `0x${string}`);
  }
  
  try {
    // Call cancelVoucher on the contract
    const { request } = await publicClient.simulateContract({
      address: NBGN_VOUCHER_CONTRACT,
      abi: VOUCHER_CONTRACT_ABI,
      functionName: 'cancelVoucher',
      args: [formattedVoucherId],
      account,
    });
    
    const txHash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    return {
      transactionHash: receipt.transactionHash,
    };
  } catch (error: any) {
    console.error('Contract call failed:', error);
    throw new Error(error.shortMessage || error.message || 'Failed to cancel voucher on chain');
  }
};