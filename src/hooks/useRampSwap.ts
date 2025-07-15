import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppState } from '../contexts/AppContext';

// Contract addresses on Arbitrum One
const CONTRACTS = {
  NBGN:
    process.env.REACT_APP_CONTRACT_ADDRESS ||
    '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067',
  EURE:
    process.env.REACT_APP_EURE_ADDRESS ||
    '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum One
  USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum One
  WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum One
  UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
  CURVE_ROUTER_NG: '0x2191718CD32d02B8E60BAdFFeA33E4B5DD9A0A0D', // Curve Router-NG on Arbitrum (current version)
  CURVE_META_REGISTRY: '0x13526206545e2DC7CcfBaF28dC88F440ce7AD3e0', // Curve MetaRegistry for pool discovery
  CURVE_STABLE_FACTORY_HANDLER: '0x39FFd8A06E80c12AC9151c57b72E709b0d735B9f', // StableFactory Handler
  // Note: According to experts, EURe liquidity on Arbitrum is very limited (~$3.5k Uniswap, uncertain Curve)
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
  'function mint(uint256 eureAmount) returns (uint256)',
  'function calculateNbgnAmount(uint256 eureAmount) view returns (uint256)',
  'function calculateEureAmount(uint256 nbgnAmount) view returns (uint256)',
  'function getReserveRatio() view returns (uint256)',
  'function redeem(uint256 nbgnAmount) returns (uint256)',
];

// Uniswap V3 Router ABI (minimal) - commented out as we're using Curve instead
// const UNISWAP_ROUTER_ABI = [
//   'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
//   'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
// ];

// Curve MetaRegistry ABI for pool discovery
const CURVE_META_REGISTRY_ABI = [
  'function find_pools_for_coins(address _from, address _to) view returns (address[] memory)',
  'function find_pool_for_coins(address _from, address _to, uint256 i) view returns (address)',
  'function get_n_coins(address _pool) view returns (uint256)',
  'function get_coin_indices(address _pool, address _from, address _to) view returns (int128, int128, bool)',
];

// Curve Pool ABI for direct interaction
const CURVE_POOL_ABI = [
  'function get_dy(int128 i, int128 j, uint256 dx) view returns (uint256)',
  'function exchange(int128 i, int128 j, uint256 _dx, uint256 _min_dy) returns (uint256)',
  'function coins(uint256 arg0) view returns (address)',
];

export const useRampSwap = () => {
  const { web3 } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get token balances
  const getTokenBalance = useCallback(
    async (tokenAddress: string, userAddress: string) => {
      if (!web3.provider) return '0';

      try {
        const contract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          web3.provider
        );
        const balance = await contract.balanceOf(userAddress);
        const decimals = await contract.decimals();
        return ethers.formatUnits(balance, decimals);
      } catch (err) {
        console.error('Error getting balance:', err);
        return '0';
      }
    },
    [web3.provider]
  );

  // Get USDC balance
  const getUSDCBalance = useCallback(
    async (userAddress: string) => {
      return getTokenBalance(CONTRACTS.USDC, userAddress);
    },
    [getTokenBalance]
  );

  // Get EURe balance
  const getEUReBalance = useCallback(
    async (userAddress: string) => {
      return getTokenBalance(CONTRACTS.EURE, userAddress);
    },
    [getTokenBalance]
  );

  // Check token allowance
  const checkAllowance = useCallback(
    async (
      tokenAddress: string,
      ownerAddress: string,
      spenderAddress: string
    ) => {
      if (!web3.provider) return '0';

      try {
        const contract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          web3.provider
        );
        const allowance = await contract.allowance(
          ownerAddress,
          spenderAddress
        );
        const decimals = await contract.decimals();
        return ethers.formatUnits(allowance, decimals);
      } catch (err) {
        console.error('Error checking allowance:', err);
        return '0';
      }
    },
    [web3.provider]
  );

  // Approve token spending
  const approveToken = useCallback(
    async (tokenAddress: string, spenderAddress: string, amount: string) => {
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
    },
    [web3.provider]
  );

  // Helper function to encode multi-hop path - commented out as we're using Curve instead
  // const encodePath = (tokens: string[], fees: number[]) => {
  //   const FEE_SIZE = 3;
  //
  //   let encoded = '0x';
  //   for (let index = 0; index < tokens.length; index++) {
  //     const token = tokens[index];
  //     if (token) {
  //       encoded += token.slice(2); // Remove 0x prefix
  //       const fee = fees[index];
  //       if (index < fees.length && fee !== undefined) {
  //         const feeHex = fee.toString(16).padStart(FEE_SIZE * 2, '0');
  //         encoded += feeHex;
  //       }
  //     }
  //   }
  //   return encoded;
  // };

  // Swap USDC to EURe using Curve Finance with MetaRegistry discovery
  const swapUSDCToEURe = useCallback(
    async (usdcAmount: string, slippageTolerance: number = 5) => {
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

        // Step 1: Try to find pool using MetaRegistry
        console.log('Searching for EURe/USDC pool using Curve MetaRegistry...');
        const metaRegistry = new ethers.Contract(
          CONTRACTS.CURVE_META_REGISTRY,
          CURVE_META_REGISTRY_ABI,
          web3.provider
        );

        let poolAddress: string | null = null;

        try {
          // Find pool for USDC -> EURe
          poolAddress = await metaRegistry.find_pool_for_coins(
            CONTRACTS.USDC,
            CONTRACTS.EURE,
            0 // first pool
          );
          console.log('Found pool via MetaRegistry:', poolAddress);
        } catch (err) {
          console.log('MetaRegistry search failed:', err);
        }

        // If no pool found, try reverse order (EURe -> USDC)
        if (!poolAddress || poolAddress === ethers.ZeroAddress) {
          try {
            poolAddress = await metaRegistry.find_pool_for_coins(
              CONTRACTS.EURE,
              CONTRACTS.USDC,
              0
            );
            console.log('Found pool via MetaRegistry (reversed):', poolAddress);
          } catch (err) {
            console.log('Reverse MetaRegistry search failed:', err);
          }
        }

        // If still no pool, check all pools containing these coins
        if (!poolAddress || poolAddress === ethers.ZeroAddress) {
          try {
            const pools = await metaRegistry.find_pools_for_coins(
              CONTRACTS.USDC,
              CONTRACTS.EURE
            );
            if (pools && pools.length > 0) {
              poolAddress = pools[0];
              console.log('Found pools:', pools);
            }
          } catch (err) {
            console.log('Pool array search failed:', err);
          }
        }

        // If no pool found after all attempts, throw error
        if (!poolAddress || poolAddress === ethers.ZeroAddress) {
          throw new Error(
            'Не може да се намери EURe/USDC pool за автоматична конверсия. ' +
              'Алтернатива: Купете EURe директно от Monerium и използвайте опцията "Купи NBGN" за EURe → NBGN.'
          );
        }

        // Step 2: Get coin indices for the pool
        const indices = await metaRegistry.get_coin_indices(
          poolAddress,
          CONTRACTS.USDC,
          CONTRACTS.EURE
        );
        const i = indices[0];
        const j = indices[1];

        console.log(`Pool ${poolAddress} indices: USDC=${i}, EURe=${j}`);

        // Step 3: Interact with the pool directly
        const pool = new ethers.Contract(poolAddress, CURVE_POOL_ABI, signer);

        // Check and approve USDC for the pool
        const allowance = await checkAllowance(
          CONTRACTS.USDC,
          userAddress,
          poolAddress
        );
        if (parseFloat(allowance) < parseFloat(usdcAmount)) {
          console.log('Approving USDC for Curve pool...');
          await approveToken(CONTRACTS.USDC, poolAddress, usdcAmount);
        }

        const amountIn = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals

        // First, verify the pool has the correct coins at the expected indices
        try {
          const coin0 = await pool.coins(Number(i));
          const coin1 = await pool.coins(Number(j));
          console.log(`Pool coins: ${i}=${coin0}, ${j}=${coin1}`);

          // Verify the coins match what we expect
          if (
            coin0.toLowerCase() !== CONTRACTS.USDC.toLowerCase() ||
            coin1.toLowerCase() !== CONTRACTS.EURE.toLowerCase()
          ) {
            throw new Error('Pool coin configuration mismatch');
          }
        } catch (err) {
          console.error('Error verifying pool coins:', err);
        }

        // Get expected output with error handling
        let expectedOut: bigint;
        try {
          // First try with a small test amount to check if pool is functional
          const testAmount = ethers.parseUnits('1', 6); // 1 USDC
          try {
            await pool.get_dy(i, j, testAmount);
          } catch (testErr) {
            console.error('Pool test failed with 1 USDC:', testErr);
            throw new Error('Pool is not functional or has no liquidity');
          }

          // Now try with the actual amount
          expectedOut = await pool.get_dy(i, j, amountIn);
          console.log(
            `Expected output: ${ethers.formatEther(expectedOut)} EURe`
          );

          // Check if output is reasonable (not 0 or extremely low)
          if (expectedOut === BigInt(0)) {
            throw new Error('Pool returned 0 output - insufficient liquidity');
          }

          // Check if output is suspiciously low (less than 50% of input value)
          const expectedMinimum = (amountIn * BigInt(50)) / BigInt(100);
          if (expectedOut < expectedMinimum) {
            console.warn(
              `Warning: Very low output. Expected at least ${ethers.formatEther(expectedMinimum)} EURe`
            );
          }
        } catch (err) {
          console.error('Error getting expected output:', err);
          throw new Error(
            'Не може да се изчисли очаквания резултат от swap. ' +
              'Вероятно няма достатъчна ликвидност в pool-а. ' +
              'Алтернатива: Купете EURe директно от Monerium.'
          );
        }

        const minOut =
          (expectedOut * BigInt(100 - slippageTolerance)) / BigInt(100);

        console.log('Executing swap on Curve pool...');
        console.log(`Amount in: ${usdcAmount} USDC`);
        console.log(`Expected out: ${ethers.formatEther(expectedOut)} EURe`);
        console.log(
          `Min out (${slippageTolerance}% slippage): ${ethers.formatEther(minOut)} EURe`
        );

        // Execute the swap with proper error handling
        try {
          const tx = await pool.exchange(i, j, amountIn, minOut, {
            gasLimit: 500000, // Add explicit gas limit
          });
          await tx.wait();

          console.log('✅ Curve swap successful!');
          return {
            hash: tx.hash,
            eureReceived: ethers.formatEther(expectedOut),
          };
        } catch (swapErr: any) {
          console.error('Exchange transaction failed:', swapErr);

          // Check for specific error conditions
          if (swapErr.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
            throw new Error(
              'Swap failed: Insufficient output amount. The pool may have low liquidity.'
            );
          } else if (swapErr.message?.includes('INSUFFICIENT_LIQUIDITY')) {
            throw new Error('Swap failed: Insufficient liquidity in the pool.');
          } else {
            throw new Error(
              'Swap транзакцията се провали. Вероятни причини:\n' +
                '1. Недостатъчна ликвидност в Curve pool\n' +
                '2. Твърде голям размер на транзакцията\n' +
                '3. Промяна в цената по време на транзакцията\n\n' +
                'Алтернативи:\n' +
                '• Опитайте с по-малка сума\n' +
                '• Увеличете slippage tolerance\n' +
                '• Купете EURe директно от Monerium и използвайте "Купи NBGN"'
            );
          }
        }
      } catch (err) {
        console.error('Swap failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [web3.provider, getUSDCBalance, checkAllowance, approveToken]
  );

  // Mint NBGN from EURe
  const mintNBGNFromEURe = useCallback(
    async (eureAmount: string) => {
      if (!web3.provider || !CONTRACTS.NBGN)
        throw new Error('No provider or NBGN contract available');

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
        const allowance = await checkAllowance(
          CONTRACTS.EURE,
          userAddress,
          CONTRACTS.NBGN
        );
        if (parseFloat(allowance) < parseFloat(eureAmount)) {
          // Need to approve first
          await approveToken(CONTRACTS.EURE, CONTRACTS.NBGN, eureAmount);
        }

        // Mint NBGN
        const nbgnContract = new ethers.Contract(
          CONTRACTS.NBGN,
          NBGN_ABI,
          signer
        );
        const eureAmountWei = ethers.parseEther(eureAmount);

        const tx = await nbgnContract.mint(eureAmountWei);
        await tx.wait();

        return {
          hash: tx.hash,
          nbgnMinted: await nbgnContract.calculateNbgnAmount(eureAmountWei),
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [web3.provider, getEUReBalance, checkAllowance, approveToken]
  );

  // Complete USDC to NBGN swap (two-step process)
  const swapUSDCToNBGN = useCallback(
    async (usdcAmount: string, slippageTolerance: number = 5) => {
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
    },
    [swapUSDCToEURe, mintNBGNFromEURe]
  );

  // Calculate expected NBGN output for given USDC input
  const calculateExpectedNBGN = useCallback(
    async (usdcAmount: string) => {
      if (!web3.provider || !CONTRACTS.NBGN) return '0';

      try {
        // Assume 1:1 USDC to EURe for estimation (in reality would query Uniswap)
        const eureAmount = usdcAmount; // Simplified assumption
        const nbgnContract = new ethers.Contract(
          CONTRACTS.NBGN,
          NBGN_ABI,
          web3.provider
        );
        const eureAmountWei = ethers.parseEther(eureAmount);
        const nbgnAmount =
          await nbgnContract.calculateNbgnAmount(eureAmountWei);
        return ethers.formatEther(nbgnAmount);
      } catch (err) {
        console.error('Error calculating NBGN:', err);
        return '0';
      }
    },
    [web3.provider]
  );

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
