import { useMemo } from 'react';
import { Contract, ethers } from 'ethers';
import { useAppState } from '../contexts/AppContext';

export const useContract = <T extends Contract>(
  address: string,
  abi: any[]
): T | null => {
  const { web3 } = useAppState();

  return useMemo(() => {
    if (!address || !abi || !web3.provider) return null;
    
    try {
      const signer = web3.provider.getSigner();
      return new ethers.Contract(address, abi, signer) as T;
    } catch (error) {
      console.error('Contract instantiation failed:', error);
      return null;
    }
  }, [address, abi, web3.provider]);
};