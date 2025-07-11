import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAppState } from '../../contexts/AppContext';
import environment from '../../config/environment';

export const ContractChecker: React.FC = () => {
  const { web3 } = useAppState();
  const [contractInfo, setContractInfo] = useState<{
    exists: boolean;
    isContract: boolean;
    hasCode: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const checkContract = async () => {
      if (!web3.provider || !environment.contractAddress) {
        return;
      }

      try {
        const code = await web3.provider.getCode(environment.contractAddress);
        const isContract = code !== '0x';
        
        setContractInfo({
          exists: true,
          isContract,
          hasCode: isContract,
        });
      } catch (error: any) {
        setContractInfo({
          exists: false,
          isContract: false,
          hasCode: false,
          error: error.message,
        });
      }
    };

    if (web3.provider) {
      checkContract();
    }
  }, [web3.provider]);

  if (!contractInfo) return null;

  return (
    <div className={`p-4 rounded-lg border-2 ${
      contractInfo.isContract 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <h4 className="font-bold mb-2">
        {contractInfo.isContract ? '✅ Contract Found' : '❌ Contract Issue'}
      </h4>
      <div className="text-sm space-y-1">
        <p><strong>Address:</strong> {environment.contractAddress}</p>
        <p><strong>Has Code:</strong> {contractInfo.hasCode ? 'Yes' : 'No'}</p>
        <p><strong>Is Contract:</strong> {contractInfo.isContract ? 'Yes' : 'No'}</p>
        {contractInfo.error && (
          <p className="text-red-600"><strong>Error:</strong> {contractInfo.error}</p>
        )}
        {!contractInfo.isContract && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 font-medium">
              This address doesn't contain a contract. Please verify:
            </p>
            <ul className="text-yellow-700 text-xs mt-2 space-y-1">
              <li>• The contract address is correct</li>
              <li>• You're on the right network (mainnet/testnet)</li>
              <li>• The contract has been deployed</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};