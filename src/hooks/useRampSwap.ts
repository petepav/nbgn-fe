import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppState } from '../contexts/AppContext';

// Contract addresses on Arbitrum One
const CONTRACTS = {
  NBGN: process.env.REACT_APP_CONTRACT_ADDRESS || '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067',
  EURE: process.env.REACT_APP_EURE_ADDRESS || '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum One
  UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

// NBGN Contract ABI
const NBGN_ABI = [
  'function mint(uint256 _eureAmount) returns (uint256)',
  'function calculateNBGN(uint256 _eureAmount) view returns (uint256)',
  'function getConversionRate() view returns (uint256, uint256)',
];

// Uniswap V3 Router ABI (minimal)
const UNISWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

export const useRampSwap = () => {
  const { web3 } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token balances
  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress: string) => {
    if (!web3.provider) return '0';
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, web3.provider);
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (err) {
      console.error('Error getting balance:', err);
      return '0';
    }
  }, [web3.provider]);

  // Get USDC balance
  const getUSDCBalance = useCallback(async (userAddress: string) => {
    return getTokenBalance(CONTRACTS.USDC, userAddress);
  }, [getTokenBalance]);

  // Get EURe balance
  const getEUReBalance = useCallback(async (userAddress: string) => {
    return getTokenBalance(CONTRACTS.EURE, userAddress);
  }, [getTokenBalance]);

  // Check token allowance
  const checkAllowance = useCallback(async (
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ) => {
    if (!web3.provider) return '0';
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, web3.provider);
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      const decimals = await contract.decimals();
      return ethers.formatUnits(allowance, decimals);
    } catch (err) {
      console.error('Error checking allowance:', err);
      return '0';
    }
  }, [web3.provider]);

  // Approve token spending
  const approveToken = useCallback(async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ) => {
    if (!web3.provider) throw new Error('No provider available');

    try {
      const signer = await web3.provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      const tx = await contract.approve(spenderAddress, amountWei);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error('Error approving token:', err);
      throw err;
    }
  }, [web3.provider]);

  // Swap USDC to EURe using Uniswap V3
  const swapUSDCToEURe = useCallback(async (usdcAmount: string, slippageTolerance: number = 1) => {
    if (!web3.provider) throw new Error('No provider available');

    try {
      setLoading(true);
      setError(null);

      const signer = await web3.provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check USDC balance
      const usdcBalance = await getUSDCBalance(userAddress);
      if (parseFloat(usdcBalance) < parseFloat(usdcAmount)) {
        throw new Error('Insufficient USDC balance');
      }

      // Check USDC allowance for Uniswap router
      const allowance = await checkAllowance(CONTRACTS.USDC, userAddress, CONTRACTS.UNISWAP_V3_ROUTER);
      if (parseFloat(allowance) < parseFloat(usdcAmount)) {
        // Need to approve first
        await approveToken(CONTRACTS.USDC, CONTRACTS.UNISWAP_V3_ROUTER, usdcAmount);
      }

      // Prepare swap parameters
      const router = new ethers.Contract(CONTRACTS.UNISWAP_V3_ROUTER, UNISWAP_ROUTER_ABI, signer);
      const amountIn = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals
      const amountOutMinimum = ethers.parseUnits(
        (parseFloat(usdcAmount) * (100 - slippageTolerance) / 100).toString(),
        18 // EURe has 18 decimals
      );

      const swapParams = {
        tokenIn: CONTRACTS.USDC,
        tokenOut: CONTRACTS.EURE,
        fee: 3000, // 0.3% fee tier (most common for stablecoin pairs)
        recipient: userAddress,
        deadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0,
      };

      const tx = await router.exactInputSingle(swapParams);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        eureReceived: ethers.formatEther(receipt.logs[receipt.logs.length - 1]?.data || '0'),
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [web3.provider, getUSDCBalance, checkAllowance, approveToken]);

  // Mint NBGN from EURe
  const mintNBGNFromEURe = useCallback(async (eureAmount: string) => {
    if (!web3.provider || !CONTRACTS.NBGN) throw new Error('No provider or NBGN contract available');

    try {
      setLoading(true);
      setError(null);

      const signer = await web3.provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check EURe balance
      const eureBalance = await getEUReBalance(userAddress);
      if (parseFloat(eureBalance) < parseFloat(eureAmount)) {
        throw new Error('Insufficient EURe balance');
      }

      // Check EURe allowance for NBGN contract
      const allowance = await checkAllowance(CONTRACTS.EURE, userAddress, CONTRACTS.NBGN);
      if (parseFloat(allowance) < parseFloat(eureAmount)) {
        // Need to approve first
        await approveToken(CONTRACTS.EURE, CONTRACTS.NBGN, eureAmount);
      }

      // Mint NBGN
      const nbgnContract = new ethers.Contract(CONTRACTS.NBGN, NBGN_ABI, signer);
      const eureAmountWei = ethers.parseEther(eureAmount);
      
      const tx = await nbgnContract.mint(eureAmountWei);
      const receipt = await tx.wait();
      
      return {
        hash: tx.hash,
        nbgnMinted: await nbgnContract.calculateNBGN(eureAmountWei),
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [web3.provider, getEUReBalance, checkAllowance, approveToken]);

  // Complete USDC to NBGN swap (two-step process)
  const swapUSDCToNBGN = useCallback(async (usdcAmount: string, slippageTolerance: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Swap USDC to EURe
      const swapResult = await swapUSDCToEURe(usdcAmount, slippageTolerance);
      
      // Step 2: Mint NBGN from EURe
      const mintResult = await mintNBGNFromEURe(swapResult.eureReceived);

      return {
        swapHash: swapResult.hash,
        mintHash: mintResult.hash,
        eureReceived: swapResult.eureReceived,
        nbgnMinted: ethers.formatEther(mintResult.nbgnMinted),
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [swapUSDCToEURe, mintNBGNFromEURe]);

  // Calculate expected NBGN output for given USDC input
  const calculateExpectedNBGN = useCallback(async (usdcAmount: string) => {
    if (!web3.provider || !CONTRACTS.NBGN) return '0';

    try {
      // Assume 1:1 USDC to EURe for estimation (in reality would query Uniswap)
      const eureAmount = usdcAmount; // Simplified assumption
      const nbgnContract = new ethers.Contract(CONTRACTS.NBGN, NBGN_ABI, web3.provider);
      const eureAmountWei = ethers.parseEther(eureAmount);
      const nbgnAmount = await nbgnContract.calculateNBGN(eureAmountWei);
      return ethers.formatEther(nbgnAmount);
    } catch (err) {
      console.error('Error calculating NBGN:', err);
      return '0';
    }
  }, [web3.provider]);

  return {
    loading,
    error,
    getUSDCBalance,
    getEUReBalance,
    swapUSDCToEURe,
    mintNBGNFromEURe,
    swapUSDCToNBGN,
    calculateExpectedNBGN,
    approveToken,
    checkAllowance,
  };
};